//! Trim excess transparent padding from PNG logos and normalize ink height.
//!
//! Logos often ship with:
//! - uneven transparent margins
//! - opaque gray fringe / noise that blocks a pure-alpha trim
//! - non-black RGB that should be pure silhouettes for Presswall mono mode
//!
//! This tool:
//! 1. Classifies "ink" pixels (dark enough + alpha above threshold)
//! 2. Optionally re-silhouettes to pure black + cleaned alpha
//! 3. Crops to the tight ink bounding box
//! 4. Resizes so ink height is uniform (default 120px)

use std::fs;
use std::path::{Path, PathBuf};
use std::process::ExitCode;

use clap::Parser;
use image::imageops::FilterType;
use image::{DynamicImage, ImageBuffer, Rgba, RgbaImage};
use walkdir::WalkDir;

#[derive(Parser, Debug)]
#[command(
    name = "trim-logos",
    about = "Trim transparent/junk padding from PNG logos and normalize ink height"
)]
struct Args {
    /// Input file or directory of PNGs
    #[arg(short, long, default_value = "public/publishers/logos")]
    input: PathBuf,

    /// Output directory (default: overwrite inputs when --in-place)
    #[arg(short, long)]
    output: Option<PathBuf>,

    /// Overwrite source files
    #[arg(long, default_value_t = false)]
    in_place: bool,

    /// Alpha (0–255) above which a pixel can count as ink
    #[arg(long, default_value_t = 16)]
    alpha_threshold: u8,

    /// Max luminance (0–255) for a pixel to count as dark ink.
    /// Gray/white fringe above this is treated as empty and cleared.
    #[arg(long, default_value_t = 220)]
    max_luminance: u8,

    /// Resize trimmed ink to this height in pixels (0 = keep natural size)
    #[arg(long, default_value_t = 120)]
    target_height: u32,

    /// Force every ink pixel to pure black (keeps cleaned alpha)
    #[arg(long, default_value_t = true)]
    resilhouette: bool,

    /// Disable re-silhouetting (keep original RGB)
    #[arg(long, default_value_t = false)]
    no_resilhouette: bool,

    /// Report only; do not write files
    #[arg(long, default_value_t = false)]
    dry_run: bool,

    /// Process recursively when input is a directory
    #[arg(long, default_value_t = false)]
    recursive: bool,
}

#[derive(Debug, Clone, Copy)]
struct Bounds {
    min_x: u32,
    min_y: u32,
    max_x: u32,
    max_y: u32,
}

impl Bounds {
    fn width(self) -> u32 {
        self.max_x - self.min_x + 1
    }

    fn height(self) -> u32 {
        self.max_y - self.min_y + 1
    }
}

#[derive(Debug)]
struct ProcessResult {
    path: PathBuf,
    before_w: u32,
    before_h: u32,
    ink_w: u32,
    ink_h: u32,
    pad_top: u32,
    pad_bottom: u32,
    pad_left: u32,
    pad_right: u32,
    after_w: u32,
    after_h: u32,
    changed: bool,
    empty: bool,
}

fn collect_pngs(input: &Path, recursive: bool) -> Result<Vec<PathBuf>, String> {
    if input.is_file() {
        if is_png(input) {
            return Ok(vec![input.to_path_buf()]);
        }
        return Err(format!("not a PNG: {}", input.display()));
    }

    if !input.is_dir() {
        return Err(format!("input not found: {}", input.display()));
    }

    let mut paths = Vec::new();
    if recursive {
        for entry in WalkDir::new(input).into_iter().filter_map(Result::ok) {
            let path = entry.path();
            if path.is_file() && is_png(path) {
                paths.push(path.to_path_buf());
            }
        }
    } else {
        let rd = fs::read_dir(input).map_err(|e| format!("read_dir {}: {e}", input.display()))?;
        for entry in rd.flatten() {
            let path = entry.path();
            if path.is_file() && is_png(&path) {
                paths.push(path);
            }
        }
    }

    paths.sort();
    Ok(paths)
}

fn is_png(path: &Path) -> bool {
    path.extension()
        .and_then(|e| e.to_str())
        .is_some_and(|e| e.eq_ignore_ascii_case("png"))
}

/// Relative luminance approximation (0–255) for sRGB-ish values.
fn luminance(r: u8, g: u8, b: u8) -> u8 {
    // Integer approximation of 0.2126 R + 0.7152 G + 0.0722 B
    let y = (54_u32 * u32::from(r) + 183 * u32::from(g) + 19 * u32::from(b)) / 256;
    y.min(255) as u8
}

fn is_ink(pixel: Rgba<u8>, alpha_threshold: u8, max_luminance: u8) -> bool {
    if pixel[3] <= alpha_threshold {
        return false;
    }
    // Coverage-weighted: faint light gray anti-alias is not ink.
    // Dark pixels (silhouettes) always count when alpha is high enough.
    luminance(pixel[0], pixel[1], pixel[2]) <= max_luminance
}

fn find_ink_bounds(
    img: &RgbaImage,
    alpha_threshold: u8,
    max_luminance: u8,
) -> Option<Bounds> {
    let (w, h) = img.dimensions();
    let mut min_x = w;
    let mut min_y = h;
    let mut max_x = 0_u32;
    let mut max_y = 0_u32;
    let mut found = false;

    for y in 0..h {
        for x in 0..w {
            let pixel = *img.get_pixel(x, y);
            if is_ink(pixel, alpha_threshold, max_luminance) {
                found = true;
                min_x = min_x.min(x);
                min_y = min_y.min(y);
                max_x = max_x.max(x);
                max_y = max_y.max(y);
            }
        }
    }

    if !found {
        return None;
    }

    Some(Bounds {
        min_x,
        min_y,
        max_x,
        max_y,
    })
}

/// Drop non-ink pixels (transparent) and optionally force pure black ink.
fn clean_image(
    img: &RgbaImage,
    alpha_threshold: u8,
    max_luminance: u8,
    resilhouette: bool,
) -> RgbaImage {
    let (w, h) = img.dimensions();
    let mut out: RgbaImage = ImageBuffer::from_pixel(w, h, Rgba([0, 0, 0, 0]));

    for y in 0..h {
        for x in 0..w {
            let pixel = *img.get_pixel(x, y);
            if !is_ink(pixel, alpha_threshold, max_luminance) {
                continue;
            }
            if resilhouette {
                // Keep original alpha so soft edges stay smooth; force black RGB.
                out.put_pixel(x, y, Rgba([0, 0, 0, pixel[3]]));
            } else {
                out.put_pixel(x, y, pixel);
            }
        }
    }

    out
}

fn crop_to_bounds(img: &RgbaImage, bounds: Bounds) -> RgbaImage {
    let mut out: RgbaImage = ImageBuffer::new(bounds.width(), bounds.height());
    for y in 0..bounds.height() {
        for x in 0..bounds.width() {
            let src = img.get_pixel(bounds.min_x + x, bounds.min_y + y);
            out.put_pixel(x, y, *src);
        }
    }
    out
}

fn resize_to_height(img: RgbaImage, target_height: u32) -> RgbaImage {
    if target_height == 0 || img.height() == target_height {
        return img;
    }

    let scale = f64::from(target_height) / f64::from(img.height());
    let new_w = (f64::from(img.width()) * scale).round().max(1.0) as u32;
    DynamicImage::ImageRgba8(img)
        .resize_exact(new_w, target_height, FilterType::Lanczos3)
        .to_rgba8()
}

fn images_equal(a: &RgbaImage, b: &RgbaImage) -> bool {
    if a.dimensions() != b.dimensions() {
        return false;
    }
    a.as_raw() == b.as_raw()
}

fn process_image(
    path: &Path,
    alpha_threshold: u8,
    max_luminance: u8,
    target_height: u32,
    resilhouette: bool,
) -> Result<(ProcessResult, Option<RgbaImage>), String> {
    let dyn_img = image::open(path).map_err(|e| format!("open {}: {e}", path.display()))?;
    let original = dyn_img.to_rgba8();
    let (before_w, before_h) = original.dimensions();

    let cleaned = clean_image(&original, alpha_threshold, max_luminance, resilhouette);

    let Some(bounds) = find_ink_bounds(&cleaned, alpha_threshold, max_luminance) else {
        return Ok((
            ProcessResult {
                path: path.to_path_buf(),
                before_w,
                before_h,
                ink_w: 0,
                ink_h: 0,
                pad_top: 0,
                pad_bottom: 0,
                pad_left: 0,
                pad_right: 0,
                after_w: before_w,
                after_h: before_h,
                changed: false,
                empty: true,
            },
            None,
        ));
    };

    let pad_left = bounds.min_x;
    let pad_top = bounds.min_y;
    let pad_right = before_w.saturating_sub(bounds.max_x + 1);
    let pad_bottom = before_h.saturating_sub(bounds.max_y + 1);
    let ink_w = bounds.width();
    let ink_h = bounds.height();

    let cropped = crop_to_bounds(&cleaned, bounds);
    let out = resize_to_height(cropped, target_height);
    let (after_w, after_h) = out.dimensions();

    let changed = !images_equal(&original, &out);

    Ok((
        ProcessResult {
            path: path.to_path_buf(),
            before_w,
            before_h,
            ink_w,
            ink_h,
            pad_top,
            pad_bottom,
            pad_left,
            pad_right,
            after_w,
            after_h,
            changed,
            empty: false,
        },
        Some(out),
    ))
}

fn resolve_output_path(
    input_path: &Path,
    input_root: &Path,
    output_dir: Option<&Path>,
    in_place: bool,
) -> Result<PathBuf, String> {
    if in_place {
        return Ok(input_path.to_path_buf());
    }

    let Some(out_root) = output_dir else {
        return Err("specify --output DIR or --in-place".into());
    };

    let rel = input_path
        .strip_prefix(input_root)
        .unwrap_or_else(|_| input_path.file_name().map(Path::new).unwrap_or(input_path));

    Ok(out_root.join(rel))
}

fn write_png(path: &Path, img: &RgbaImage) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("mkdir {}: {e}", parent.display()))?;
    }
    img.save(path)
        .map_err(|e| format!("save {}: {e}", path.display()))
}

fn print_report(results: &[ProcessResult]) {
    println!(
        "{:<32} {:>11} {:>11} {:>5} {:>5} {:>5} {:>5} {:>11} {}",
        "file", "before", "ink", "T", "B", "L", "R", "after", "status"
    );

    let mut changed = 0_usize;
    let mut empty = 0_usize;

    for r in results {
        let name = r
            .path
            .file_name()
            .and_then(|s| s.to_str())
            .unwrap_or("?");
        let status = if r.empty {
            empty += 1;
            "EMPTY"
        } else if r.changed {
            changed += 1;
            "TRIMMED"
        } else {
            "ok"
        };

        println!(
            "{:<32} {:>5}x{:<4} {:>5}x{:<4} {:>5} {:>5} {:>5} {:>5} {:>5}x{:<4} {}",
            name,
            r.before_w,
            r.before_h,
            r.ink_w,
            r.ink_h,
            r.pad_top,
            r.pad_bottom,
            r.pad_left,
            r.pad_right,
            r.after_w,
            r.after_h,
            status
        );
    }

    println!();
    println!(
        "Processed {} file(s): {} changed, {} empty, {} already tight.",
        results.len(),
        changed,
        empty,
        results.len().saturating_sub(changed + empty)
    );
}

fn main() -> ExitCode {
    let args = Args::parse();
    let resilhouette = args.resilhouette && !args.no_resilhouette;

    if !(args.in_place || args.output.is_some() || args.dry_run) {
        eprintln!("error: specify --in-place, --output DIR, or --dry-run");
        return ExitCode::from(2);
    }

    let paths = match collect_pngs(&args.input, args.recursive) {
        Ok(p) if !p.is_empty() => p,
        Ok(_) => {
            eprintln!("no PNG files found under {}", args.input.display());
            return ExitCode::from(1);
        }
        Err(e) => {
            eprintln!("error: {e}");
            return ExitCode::from(1);
        }
    };

    let input_root = if args.input.is_dir() {
        args.input.clone()
    } else {
        args.input
            .parent()
            .unwrap_or_else(|| Path::new("."))
            .to_path_buf()
    };

    let mut results = Vec::with_capacity(paths.len());
    let mut errors = 0_usize;

    for path in &paths {
        match process_image(
            path,
            args.alpha_threshold,
            args.max_luminance,
            args.target_height,
            resilhouette,
        ) {
            Ok((result, image)) => {
                if !args.dry_run {
                    if result.changed {
                        if let Some(img) = image {
                            match resolve_output_path(
                                path,
                                &input_root,
                                args.output.as_deref(),
                                args.in_place,
                            ) {
                                Ok(out_path) => {
                                    if let Err(e) = write_png(&out_path, &img) {
                                        eprintln!("error: {e}");
                                        errors += 1;
                                    }
                                }
                                Err(e) => {
                                    eprintln!("error: {e}");
                                    errors += 1;
                                }
                            }
                        }
                    } else if !result.empty && !args.in_place {
                        if let Some(out_dir) = args.output.as_ref() {
                            match resolve_output_path(path, &input_root, Some(out_dir), false) {
                                Ok(out_path) => match image::open(path) {
                                    Ok(src) => {
                                        if let Err(e) = write_png(&out_path, &src.to_rgba8()) {
                                            eprintln!("error: {e}");
                                            errors += 1;
                                        }
                                    }
                                    Err(e) => {
                                        eprintln!("error: open {}: {e}", path.display());
                                        errors += 1;
                                    }
                                },
                                Err(e) => {
                                    eprintln!("error: {e}");
                                    errors += 1;
                                }
                            }
                        }
                    }
                }

                results.push(result);
            }
            Err(e) => {
                eprintln!("error: {e}");
                errors += 1;
            }
        }
    }

    print_report(&results);

    if args.dry_run {
        println!("(dry-run: no files written)");
    }

    if errors > 0 {
        ExitCode::from(1)
    } else {
        ExitCode::SUCCESS
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::Rgba;

    fn solid_with_padding(
        pad_l: u32,
        pad_t: u32,
        ink_w: u32,
        ink_h: u32,
        pad_r: u32,
        pad_b: u32,
    ) -> RgbaImage {
        let w = pad_l + ink_w + pad_r;
        let h = pad_t + ink_h + pad_b;
        let mut img = ImageBuffer::from_pixel(w, h, Rgba([0, 0, 0, 0]));
        for y in pad_t..(pad_t + ink_h) {
            for x in pad_l..(pad_l + ink_w) {
                img.put_pixel(x, y, Rgba([0, 0, 0, 255]));
            }
        }
        img
    }

    #[test]
    fn finds_bounds_ignoring_transparent_padding() {
        let img = solid_with_padding(10, 5, 40, 20, 8, 3);
        let bounds = find_ink_bounds(&img, 16, 220).expect("ink");
        assert_eq!(bounds.min_x, 10);
        assert_eq!(bounds.min_y, 5);
        assert_eq!(bounds.width(), 40);
        assert_eq!(bounds.height(), 20);
    }

    #[test]
    fn ignores_light_opaque_fringe() {
        let mut img = solid_with_padding(5, 5, 20, 10, 5, 5);
        // light gray opaque fringe on left columns
        for y in 0..img.height() {
            for x in 0..5 {
                img.put_pixel(x, y, Rgba([240, 240, 240, 255]));
            }
        }
        let bounds = find_ink_bounds(&img, 16, 220).expect("ink");
        assert_eq!(bounds.min_x, 5);
        assert_eq!(bounds.width(), 20);
    }

    #[test]
    fn resize_preserves_aspect() {
        let img = solid_with_padding(0, 0, 200, 50, 0, 0);
        let out = resize_to_height(img, 100);
        assert_eq!(out.height(), 100);
        assert_eq!(out.width(), 400);
    }

    #[test]
    fn resilhouette_forces_black() {
        let mut img: RgbaImage = ImageBuffer::from_pixel(4, 4, Rgba([0, 0, 0, 0]));
        img.put_pixel(1, 1, Rgba([40, 40, 40, 200]));
        let cleaned = clean_image(&img, 16, 220, true);
        assert_eq!(*cleaned.get_pixel(1, 1), Rgba([0, 0, 0, 200]));
        assert_eq!(*cleaned.get_pixel(0, 0), Rgba([0, 0, 0, 0]));
    }
}

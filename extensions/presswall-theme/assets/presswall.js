const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const RGB_COLOR = /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/;
const SVG_ROOT = /<svg[\s>]/i;
const SCRIPT_TAG = /<script[\s\S]*?<\/script>/gi;
const FOREIGN_OBJECT_TAG = /<foreignObject[\s\S]*?<\/foreignObject>/gi;
const EVENT_HANDLER_ATTR = /\s(on\w+)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const JAVASCRIPT_URI = /javascript:/gi;
// Keep in sync with lib/presswall-validation.ts and lib/presswall-heading-rules.ts.
const MAX_CUSTOM_LOGO_SVG_LENGTH = 50_000;
const INLINE_HEX_COLOR_PATTERN = /^[0-9a-f]{3}([0-9a-f]{3})?$/i;
const INLINE_RGB_COLOR_PATTERN =
  /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i;

(function presswallInit() {
  if (
    typeof globalThis.Shopify !== "undefined" &&
    globalThis.Shopify.visualPreviewMode
  ) {
    return;
  }

  const roots = document.querySelectorAll("[data-presswall-root]");
  if (!roots.length) {
    return;
  }

  for (const root of roots) {
    const proxyUrl = buildContextAwareProxyUrl(root);
    if (!proxyUrl) {
      continue;
    }

    const isDesignMode = root.hasAttribute("data-presswall-design-mode");
    const hasStaticPreview = Boolean(
      root.querySelector("[data-presswall-static-preview]")
    );
    const inlineConfig = root.querySelector("[data-presswall-config]");

    if (inlineConfig?.textContent) {
      try {
        const payload = JSON.parse(inlineConfig.textContent);
        const rendered = renderPresswall(payload);
        if (rendered) {
          root.innerHTML = rendered;
          continue;
        }
      } catch {
        // Fall back to app proxy fetch below.
      }
    }

    fetch(proxyUrl, { credentials: "same-origin", cache: "no-store" })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Load failed");
        }

        const contentType = response.headers.get("content-type") ?? "";
        if (!contentType.includes("application/json")) {
          throw new Error("Invalid response");
        }

        return response.json();
      })
      .then((payload) => {
        const rendered = renderPresswall(payload);
        if (!rendered) {
          if (isDesignMode && hasStaticPreview) {
            return;
          }

          root.innerHTML =
            '<div class="presswall-loading">Add outlets in Presswall.</div>';
          return;
        }

        root.innerHTML = rendered;
      })
      .catch(() => {
        if (isDesignMode && hasStaticPreview) {
          return;
        }

        root.innerHTML =
          '<div class="presswall-loading">Not configured yet.</div>';
      });
  }

  function buildContextAwareProxyUrl(root) {
    const baseUrl = root.dataset.proxyUrl;
    if (!baseUrl) {
      return null;
    }

    const url = new URL(baseUrl, window.location.origin);
    const contextNode =
      root.querySelector("[data-page-type], [data-product-id]") ?? root;
    const pageType = (root.dataset.pageType ?? contextNode.dataset.pageType)
      ?.trim()
      .toLowerCase();
    const productId = (
      root.dataset.productId ?? contextNode.dataset.productId
    )?.trim();

    if (pageType) {
      url.searchParams.set("page_type", pageType);
    }

    if (productId) {
      url.searchParams.set("product_id", productId);
    }

    return url.toString();
  }

  function renderPresswall(config) {
    if (!config.publishers || config.publishers.length === 0) {
      return "";
    }

    const backgroundColor = sanitizeCssColor(
      config.backgroundColor,
      "transparent"
    );
    const textColor = sanitizeCssColor(config.textColor, "#111111");
    const borderRadius = sanitizeCssSize(config.borderRadius, 0);
    const paddingY = sanitizeCssSize(config.paddingY, 16);
    const paddingX = sanitizeCssSize(config.paddingX, 16);
    const contentMaxWidth = sanitizeCssSize(config.contentMaxWidth, 840);
    const gap = sanitizeCssSize(config.gap, 12);
    const headingFontSize = sanitizeCssSize(config.headingFontSize, 12);
    const headingSpacing = sanitizeCssSize(config.headingSpacing, 40);
    const logosPerRowDesktop = clampInt(
      config.logosPerRowDesktop ?? config.logosPerRow,
      4,
      2,
      8
    );
    const logosPerRowMobile = clampInt(config.logosPerRowMobile, 2, 1, 4);
    const marqueeSpeed = sanitizeCssSize(config.marqueeSpeed, 30);
    const headingAlignment = sanitizeAlignment(
      config.headingAlignment ?? config.alignment
    );
    const logoAlignment = sanitizeAlignment(
      config.logoAlignment ?? config.headingAlignment ?? config.alignment
    );

    const style = [
      `background:${backgroundColor}`,
      `color:${textColor}`,
      `border-radius:${borderRadius}px`,
      `--presswall-padding-y:${paddingY}px`,
      `--presswall-padding-x:${paddingX}px`,
      `--presswall-logo-height:${sanitizeCssSize(config.logoHeight, 28)}px`,
      `--presswall-content-max-width:${contentMaxWidth}px`,
      `--presswall-gap:${gap}px`,
      `--presswall-heading-size:${headingFontSize}px`,
      `--presswall-heading-spacing:${headingSpacing}px`,
    ].join(";");

    const inlineMarqueeHeading =
      config.layout === "marquee" &&
      config.showHeading &&
      config.headingText &&
      headingAlignment === "left";

    const heading =
      config.showHeading &&
      config.headingText &&
      (config.layout !== "marquee" || !inlineMarqueeHeading)
        ? `<p class="presswall-heading presswall-heading-align-${headingAlignment}" style="color:${textColor}">${escapeHtml(config.headingText)}</p>`
        : "";

    const logoStyle = getLogoStyle(config);
    const logos = config.publishers
      .map((publisher) => renderLogo(publisher, config, logoStyle))
      .join("");

    if (config.layout === "marquee") {
      return renderMarquee(
        config,
        style,
        backgroundColor,
        textColor,
        headingFontSize,
        marqueeSpeed,
        logos,
        headingAlignment
      );
    }

    const logoSpacing =
      config.layout === "bar" && config.logoSpacing !== "gap"
        ? "space-between"
        : "gap";

    return `<div class="presswall-shell" style="${style}"><div class="presswall-content">${heading}<div class="presswall-bar presswall-spacing-${logoSpacing} presswall-align-${logoAlignment}" style="--lpr-d:${logosPerRowDesktop};--lpr-m:${logosPerRowMobile}">${logos}</div></div></div>`;
  }

  function renderMarquee(c, s, bg, tx, hf, sp, logos, headingAlignment) {
    const n = marqueeSegments(c.publishers.length);
    const inlineHeading =
      c.showHeading && c.headingText && headingAlignment === "left";
    const aboveHeading =
      c.showHeading && c.headingText && !inlineHeading
        ? `<p class="presswall-heading presswall-heading-align-${headingAlignment}" style="color:${tx}">${escapeHtml(c.headingText)}</p>`
        : "";
    const lead = inlineHeading
      ? `<div class="pw-mq-lead"><p class="pw-mq-label" style="color:${tx};font-size:${hf}px">${escapeHtml(c.headingText)}</p><span class="pw-mq-div"></span></div>`
      : "";
    const fade = bg === "transparent" ? "#fff" : bg;
    return `<div class="presswall-shell" style="${s}"><div class="presswall-content">${aboveHeading}<div class="pw-mq-row">${lead}<div class="pw-mq-scroll" style="--pw-mq-fade:${fade}"><div class="pw-mq-wrap"><div class="pw-mq-track" style="animation-duration:${sp}s;--pw-mq-n:${n}">${logos.repeat(n)}</div></div><span class="pw-mq-fade pw-mq-fade-left" aria-hidden="true"></span><span class="pw-mq-fade pw-mq-fade-right" aria-hidden="true"></span></div></div></div></div>`;
  }

  function renderLogo(publisher, config, logoStyle) {
    const height = sanitizeCssSize(config.logoHeight, 28);
    let content;
    if (publisher.logoImageUrl) {
      content = `<img alt="" class="presswall-logo-img" src="${escapeHtml(publisher.logoImageUrl)}" />`;
    } else if (publisher.logoSvg) {
      content = renderSvgLogo(publisher.logoSvg);
    } else {
      content = `<span>${escapeHtml(publisher.name)}</span>`;
    }

    const safeUrl = sanitizeUrl(publisher.url);
    const linked = safeUrl
      ? `<a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer">${content}</a>`
      : content;

    return `<div class="presswall-logo" style="height:${height}px;${logoStyle}">${linked}</div>`;
  }

  function renderSvgLogo(svg) {
    const sanitized = sanitizeSvg(svg);
    if (!sanitized) {
      return "";
    }

    return `<img alt="" class="presswall-logo-img" src="data:image/svg+xml,${encodeURIComponent(sanitized)}" />`;
  }

  function getLogoStyle(config) {
    const filters = [];

    if (config.colorMode === "muted" || config.colorMode === "mono") {
      filters.push("grayscale(100%)");
    }

    if (shouldInvertLogos(config)) {
      filters.push("invert(1)");
    }

    if (config.colorMode === "muted") {
      const opacity = sanitizeCssSize(config.grayscaleOpacity, 70) / 100;
      const filter = filters.length ? `filter:${filters.join(" ")};` : "";
      return `${filter}opacity:${opacity}`;
    }

    if (filters.length) {
      return `filter:${filters.join(" ")}`;
    }

    return "";
  }

  function shouldInvertLogos(config) {
    if (config.colorMode === "color") {
      return false;
    }

    const backgroundColor = String(config.backgroundColor ?? "")
      .trim()
      .toLowerCase();

    if (backgroundColor === "transparent") {
      return false;
    }

    return isDarkBackgroundColor(backgroundColor);
  }

  function isDarkBackgroundColor(color) {
    const rgb = parseCssColor(color);
    if (!rgb) {
      return false;
    }

    return relativeLuminance(rgb[0], rgb[1], rgb[2]) < 0.4;
  }

  function parseCssColor(color) {
    if (color.startsWith("#")) {
      const hex = color.slice(1);
      if (!INLINE_HEX_COLOR_PATTERN.test(hex)) {
        return null;
      }

      const normalized =
        hex.length === 3
          ? hex
              .split("")
              .map((char) => char + char)
              .join("")
          : hex;

      return [
        Number.parseInt(normalized.slice(0, 2), 16),
        Number.parseInt(normalized.slice(2, 4), 16),
        Number.parseInt(normalized.slice(4, 6), 16),
      ];
    }

    const match = color.match(INLINE_RGB_COLOR_PATTERN);

    if (!match) {
      return null;
    }

    return [Number(match[1]), Number(match[2]), Number(match[3])];
  }

  function relativeLuminance(red, green, blue) {
    const toLinear = (channel) => {
      const normalized = channel / 255;
      return normalized <= 0.039_28
        ? normalized / 12.92
        : ((normalized + 0.055) / 1.055) ** 2.4;
    };

    const linearRed = toLinear(red);
    const linearGreen = toLinear(green);
    const linearBlue = toLinear(blue);

    return 0.2126 * linearRed + 0.7152 * linearGreen + 0.0722 * linearBlue;
  }

  function sanitizeAlignment(value) {
    if (value === "left" || value === "right") {
      return value;
    }

    return "center";
  }

  function sanitizeCssColor(value, fallback) {
    const candidate = String(value ?? "").trim();
    if (candidate === "transparent") {
      return candidate;
    }

    if (HEX_COLOR.test(candidate)) {
      return candidate;
    }

    if (RGB_COLOR.test(candidate)) {
      return candidate;
    }

    return fallback;
  }

  function sanitizeCssSize(value, fallback) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }

    return Math.max(0, Math.round(parsed));
  }

  function clampInt(value, fallback, min, max) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }

    return Math.min(max, Math.max(min, Math.round(parsed)));
  }

  function marqueeSegments(count) {
    if (!count) {
      return 2;
    }

    return Math.max(2, Math.min(8, Math.ceil(18 / count)));
  }

  function sanitizeUrl(url) {
    if (!url) {
      return null;
    }

    try {
      const parsed = new URL(String(url));
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        return parsed.href;
      }
    } catch {
      return null;
    }

    return null;
  }

  function sanitizeSvg(svg) {
    const trimmed = String(svg ?? "").trim();
    if (!trimmed) {
      return "";
    }

    const cleaned = trimmed
      .slice(0, MAX_CUSTOM_LOGO_SVG_LENGTH)
      .replace(SCRIPT_TAG, "")
      .replace(FOREIGN_OBJECT_TAG, "")
      .replace(EVENT_HANDLER_ATTR, "")
      .replace(JAVASCRIPT_URI, "");

    if (!SVG_ROOT.test(cleaned)) {
      return "";
    }

    return cleaned;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }
})();

const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const RGB_COLOR = /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/;
const SVG_ROOT = /<svg[\s>]/i;
const SCRIPT_TAG = /<script[\s\S]*?<\/script>/gi;
const FOREIGN_OBJECT_TAG = /<foreignObject[\s\S]*?<\/foreignObject>/gi;
const EVENT_HANDLER_ATTR = /\s(on\w+)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const JAVASCRIPT_URI = /javascript:/gi;
// Keep in sync with lib/presswall-validation.ts and lib/presswall-heading-rules.ts.
const MAX_CUSTOM_LOGO_SVG_LENGTH = 50_000;

(function presswallInit() {
  const isVisualPreview =
    typeof globalThis.Shopify !== "undefined" &&
    globalThis.Shopify.visualPreviewMode;

  const roots = document.querySelectorAll("[data-presswall-root]");
  if (!roots.length) {
    return;
  }

  for (const root of roots) {
    const isDesignMode = root.hasAttribute("data-presswall-design-mode");
    const hasStaticPreview = Boolean(
      root.querySelector("[data-presswall-static-preview]")
    );
    const inlineConfig = root.querySelector("[data-presswall-config]");

    // Prefer embedded metafield payload (matches admin; works in theme editor).
    if (inlineConfig?.textContent) {
      try {
        const payload = normalizePayload(JSON.parse(inlineConfig.textContent));
        const rendered = renderPresswall(payload);
        if (rendered) {
          root.innerHTML = rendered;
          // Still refresh from proxy when not in visual-preview / when online.
          if (!isVisualPreview && root.dataset.proxyUrl) {
            hydrateFromProxy(root, isDesignMode, hasStaticPreview);
          }
          continue;
        }
      } catch {
        // Fall back to app proxy fetch below.
      }
    }

    // Theme editor visual preview often blocks network — keep liquid SSR.
    if (isVisualPreview) {
      continue;
    }

    if (!root.dataset.proxyUrl) {
      continue;
    }

    hydrateFromProxy(root, isDesignMode, hasStaticPreview);
  }

  function normalizePayload(payload) {
    if (!payload || typeof payload !== "object") {
      return payload;
    }
    // Metafield manifest v2/v3 wraps the strip config in `fallback`.
    if (payload.fallback && Array.isArray(payload.fallback.publishers)) {
      return payload.fallback;
    }
    return payload;
  }

  function hydrateFromProxy(root, isDesignMode, hasStaticPreview) {
    const proxyUrl = root.dataset.proxyUrl;
    if (!proxyUrl) {
      return;
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
        const rendered = renderPresswall(normalizePayload(payload));
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

        // Keep any liquid-rendered design if proxy fails.
        if (root.querySelector(".presswall-shell")) {
          return;
        }

        root.innerHTML =
          '<div class="presswall-loading">Not configured yet.</div>';
      });
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
    const paddingY = sanitizeCssSize(config.paddingY, 16);
    const paddingX = sanitizeCssSize(config.paddingX, 16);
    const contentMaxWidth = sanitizeCssSize(config.contentMaxWidth, 900);
    const gap = sanitizeCssSize(config.gap, 12);
    const headingFontSize = sanitizeCssSize(config.headingFontSize, 12);
    const headingSpacing = sanitizeCssSize(config.headingSpacing, 40);
    const publisherCount = Array.isArray(config.publishers)
      ? config.publishers.length
      : 0;
    const logosPerRowDesktopConfig = clampInt(
      config.logosPerRowDesktop ?? config.logosPerRow,
      6,
      2,
      8
    );
    const logosPerRowMobileConfig = clampInt(config.logosPerRowMobile, 2, 1, 4);
    // Equal columns: never more than the logo count so 2 logos still span full width.
    const logosPerRowDesktop =
      publisherCount > 0
        ? Math.min(publisherCount, logosPerRowDesktopConfig)
        : logosPerRowDesktopConfig;
    const logosPerRowMobile =
      publisherCount > 0
        ? Math.min(publisherCount, logosPerRowMobileConfig)
        : logosPerRowMobileConfig;
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
    // Default on; only opt out when explicitly false (legacy configs lack the field).
    const pauseHover = c.marqueePauseOnHover !== false;
    const scrollClass = pauseHover
      ? "pw-mq-scroll pw-mq-scroll--pause-hover"
      : "pw-mq-scroll";
    return `<div class="presswall-shell" style="${s}"><div class="presswall-content">${aboveHeading}<div class="pw-mq-row">${lead}<div class="${scrollClass}" style="--pw-mq-fade:${fade}"><div class="pw-mq-wrap"><div class="pw-mq-track" style="animation-duration:${sp}s;--pw-mq-n:${n}">${logos.repeat(n)}</div></div><span class="pw-mq-fade pw-mq-fade-left" aria-hidden="true"></span><span class="pw-mq-fade pw-mq-fade-right" aria-hidden="true"></span></div></div></div></div>`;
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
    // Black / white / color use pre-rendered pure assets from the app.
    // Only muted dims opacity; no grayscale/invert filters (uneven ink intensity).
    if (config.colorMode === "muted" || config.invertLogos) {
      const opacity =
        config.colorMode === "muted"
          ? sanitizeCssSize(config.grayscaleOpacity, 70) / 100
          : 1;
      if (config.colorMode === "muted") {
        return `opacity:${opacity}`;
      }
    }

    return "";
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

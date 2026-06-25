(function presswallInit() {
  const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
  const RGB_COLOR = /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/;
  const SVG_ROOT = /<svg[\s>]/i;
  const SCRIPT_TAG = /<script[\s\S]*?<\/script>/gi;
  const FOREIGN_OBJECT_TAG = /<foreignObject[\s\S]*?<\/foreignObject>/gi;
  const EVENT_HANDLER_ATTR =
    /\s(on\w+)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
  const JAVASCRIPT_URI = /javascript:/gi;

  const roots = document.querySelectorAll("[data-presswall-root]");
  if (!roots.length) {
    return;
  }

  for (const root of roots) {
    const proxyUrl = root.dataset.proxyUrl;
    if (!proxyUrl) {
      return;
    }

    fetch(proxyUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load Presswall config");
        }
        return response.json();
      })
      .then((payload) => {
        root.innerHTML = renderPresswall(payload);
      })
      .catch(() => {
        root.innerHTML =
          '<div class="presswall-loading">Presswall is not configured yet.</div>';
      });
  }

  function renderPresswall(config) {
    if (!config.publishers || config.publishers.length === 0) {
      return '<div class="presswall-loading">Add outlets in the Presswall app.</div>';
    }

    const backgroundColor = sanitizeCssColor(
      config.backgroundColor,
      "transparent"
    );
    const textColor = sanitizeCssColor(config.textColor, "#111111");
    const borderRadius = sanitizeCssSize(config.borderRadius, 0);
    const paddingY = sanitizeCssSize(config.paddingY, 16);
    const paddingX = sanitizeCssSize(config.paddingX, 16);
    const gap = sanitizeCssSize(config.gap, 24);
    const marqueeSpeed = sanitizeCssSize(config.marqueeSpeed, 30);
    const alignment = sanitizeAlignment(config.alignment);

    const style = [
      `background:${backgroundColor}`,
      `color:${textColor}`,
      `border-radius:${borderRadius}px`,
      `padding:${paddingY}px ${paddingX}px`,
    ].join(";");

    const heading =
      config.showHeading && config.headingText
        ? `<p class="presswall-heading" style="color:${textColor}">${escapeHtml(config.headingText)}</p>`
        : "";

    const logoStyle = getLogoStyle(config);
    const logos = config.publishers
      .map((publisher) => renderLogo(publisher, config, logoStyle))
      .join("");

    if (config.layout === "marquee") {
      return `<div class="presswall-shell" style="${style}">${heading}<div class="presswall-marquee-wrap"><div class="presswall-marquee-track presswall-align-${alignment}" style="gap:${gap}px;animation-duration:${marqueeSpeed}s">${logos}${logos}</div></div></div>`;
    }

    if (config.layout === "grid") {
      return `<div class="presswall-shell" style="${style}">${heading}<div class="presswall-grid" style="gap:${gap}px">${config.publishers
        .map(
          (publisher) =>
            `<div class="presswall-grid-item">${renderLogo(publisher, config, logoStyle)}</div>`
        )
        .join("")}</div></div>`;
    }

    return `<div class="presswall-shell" style="${style}">${heading}<div class="presswall-bar presswall-align-${alignment}" style="gap:${gap}px">${logos}</div></div>`;
  }

  function renderLogo(publisher, config, logoStyle) {
    const height = sanitizeCssSize(config.logoHeight, 32);
    const content = publisher.logoSvg
      ? renderSvgLogo(publisher.logoSvg)
      : `<span>${escapeHtml(publisher.name)}</span>`;

    const safeUrl = sanitizeUrl(publisher.url);
    const linked = safeUrl
      ? `<a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer">${content}</a>`
      : content;

    return `<div class="presswall-logo presswall-marquee-item" style="height:${height}px;${logoStyle}">${linked}</div>`;
  }

  function renderSvgLogo(svg) {
    const sanitized = sanitizeSvg(svg);
    if (!sanitized) {
      return "";
    }

    return `<img alt="" class="presswall-logo-img" src="data:image/svg+xml,${encodeURIComponent(sanitized)}" />`;
  }

  function getLogoStyle(config) {
    if (config.colorMode === "muted") {
      const opacity = sanitizeCssSize(config.grayscaleOpacity, 70) / 100;
      return `filter:grayscale(100%) opacity(${opacity})`;
    }

    if (config.colorMode === "mono") {
      return "filter:grayscale(100%)";
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

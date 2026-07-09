"use client";

import { useState } from "react";
import { isBundledPublisherId } from "@/lib/bundled-publishers";
import { customLogoSvgDataUrl } from "@/lib/custom-logo-render";
import { bundledLogoPath } from "@/lib/publisher-logo-path";
import { cn } from "@/lib/utils";

interface PublisherLogoProps {
  className?: string;
  /** Strip colorMode — selects color/black/white logo asset for bundled marks. */
  colorMode?: string | null;
  customLogoSvg?: string;
  logoImageUrl?: string | null;
  name: string;
  publisherId?: string;
  style?: React.CSSProperties;
}

function LogoSlot({
  children,
  className,
  style,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}) {
  return (
    <span
      className={cn("presswall-logo-slot", className)}
      style={style}
      title={title}
    >
      {children}
    </span>
  );
}

export function PublisherLogo({
  publisherId,
  logoImageUrl,
  name,
  customLogoSvg,
  colorMode,
  className,
  style,
}: PublisherLogoProps) {
  const [failed, setFailed] = useState(false);

  if (customLogoSvg) {
    const dataUrl = customLogoSvgDataUrl(customLogoSvg);

    return (
      <LogoSlot className={className} style={style} title={name}>
        {dataUrl ? (
          // biome-ignore lint/performance/noImgElement: embedded svg data urls are more reliable than inline svg
          <img
            alt=""
            className="presswall-logo-img"
            height={28}
            src={dataUrl}
            width={336}
          />
        ) : (
          <span className="font-semibold text-[0.625rem] text-muted-foreground uppercase">
            {name.slice(0, 2)}
          </span>
        )}
      </LogoSlot>
    );
  }

  const logoUrl =
    logoImageUrl ??
    (publisherId && isBundledPublisherId(publisherId)
      ? bundledLogoPath(publisherId, { colorMode })
      : null);

  if (!logoUrl || failed) {
    return (
      <LogoSlot className={className} style={style} title={name}>
        <span className="font-semibold text-[0.625rem] text-muted-foreground uppercase">
          {name.slice(0, 2)}
        </span>
      </LogoSlot>
    );
  }

  return (
    <LogoSlot className={className} style={style} title={name}>
      {/* biome-ignore lint/performance/noImgElement: bundled logos are served from /api and load reliably in embedded admin */}
      {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: onError fallback when a logo asset fails to load */}
      <img
        alt={`${name} logo`}
        className="presswall-logo-img"
        height={28}
        onError={() => setFailed(true)}
        src={logoUrl}
        width={336}
      />
    </LogoSlot>
  );
}

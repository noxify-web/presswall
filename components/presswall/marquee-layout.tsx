"use client";

import type { CSSProperties, ReactNode } from "react";
import { getMarqueeScrollStyle } from "@/lib/presswall-marquee-fade";
import type { PresswallConfig } from "@/lib/presswall-types";
import { cn } from "@/lib/utils";

interface MarqueeTrackProps {
  children: ReactNode;
  style?: CSSProperties;
}

export function MarqueeTrack({ children, style }: MarqueeTrackProps) {
  return (
    <div
      className="pw-mq-track flex shrink-0 flex-row flex-nowrap items-center"
      style={style}
    >
      {children}
    </div>
  );
}

interface MarqueeLayoutProps {
  backgroundColor: string;
  children: ReactNode;
  className?: string;
  config: Pick<
    PresswallConfig,
    "headingFontSize" | "headingText" | "showHeading" | "marqueePauseOnHover"
  >;
  labelStyle?: CSSProperties;
  textColor: string;
}

export function MarqueeLayout({
  backgroundColor,
  children,
  className,
  config,
  labelStyle,
  textColor,
}: MarqueeLayoutProps) {
  const showLeading = config.showHeading && config.headingText;
  const pauseOnHover = config.marqueePauseOnHover !== false;

  return (
    <div className={cn("pw-mq-row", className)}>
      {showLeading ? (
        <div className="pw-mq-lead">
          <p
            className="pw-mq-label"
            style={{
              color: textColor,
              fontSize: `${config.headingFontSize}px`,
              ...labelStyle,
            }}
          >
            {config.headingText}
          </p>
          <span aria-hidden className="pw-mq-div" />
        </div>
      ) : null}

      <div
        className={cn(
          "pw-mq-scroll",
          pauseOnHover && "pw-mq-scroll--pause-hover"
        )}
        style={getMarqueeScrollStyle(backgroundColor)}
      >
        <div className="pw-mq-wrap">{children}</div>
        <span aria-hidden className="pw-mq-fade pw-mq-fade-left" />
        <span aria-hidden className="pw-mq-fade pw-mq-fade-right" />
      </div>
    </div>
  );
}

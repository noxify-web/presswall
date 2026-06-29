"use client";

import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OnboardingActionsProps {
  backLabel?: string;
  center?: ReactNode;
  className?: string;
  compact?: boolean;
  nextDisabled?: boolean;
  nextLabel?: string;
  nextLoading?: boolean;
  onBack?: () => void;
  onNext: () => void;
  showBack?: boolean;
}

export function OnboardingActions({
  onBack,
  onNext,
  showBack = false,
  backLabel = "Back",
  nextLabel = "Next",
  nextDisabled = false,
  nextLoading = false,
  center,
  compact = false,
  className,
}: OnboardingActionsProps) {
  const buttonSize = compact ? "sm" : "lg";
  const nextClassName = compact ? "min-w-24" : "min-w-32";

  return (
    <div
      className={cn(
        "grid grid-cols-3 items-center gap-4",
        compact && "px-1",
        className
      )}
    >
      <div className="justify-self-start">
        {showBack && onBack ? (
          <Button onClick={onBack} size={buttonSize} variant="ghost">
            <IconArrowLeft stroke={2} />
            {backLabel}
          </Button>
        ) : (
          <span aria-hidden className="min-w-16" />
        )}
      </div>

      <div className="justify-self-center">{center}</div>

      <div className="justify-self-end">
        <Button
          className={nextClassName}
          disabled={nextDisabled || nextLoading}
          onClick={onNext}
          size={buttonSize}
        >
          {nextLoading ? "Saving..." : nextLabel}
          {nextLoading ? null : <IconArrowRight stroke={2} />}
        </Button>
      </div>
    </div>
  );
}

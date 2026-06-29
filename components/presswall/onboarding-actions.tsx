"use client";

import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OnboardingActionsProps {
  backLabel?: string;
  className?: string;
  compact?: boolean;
  nextDisabled?: boolean;
  nextLabel?: string;
  nextLoading?: boolean;
  onBack?: () => void;
  onNext: () => void;
  onSkip?: () => void;
  showBack?: boolean;
  skipLoading?: boolean;
}

export function OnboardingActions({
  onBack,
  onNext,
  onSkip,
  showBack = false,
  backLabel = "Back",
  nextLabel = "Next",
  nextDisabled = false,
  nextLoading = false,
  skipLoading = false,
  compact = false,
  className,
}: OnboardingActionsProps) {
  const buttonSize = compact ? "sm" : "lg";
  const nextClassName = compact ? "min-w-24" : "min-w-32";

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4",
        compact && "px-1",
        className
      )}
    >
      <div className="flex items-center gap-1">
        {onSkip ? (
          <Button
            disabled={skipLoading}
            onClick={onSkip}
            size={buttonSize}
            variant="ghost"
          >
            Skip
          </Button>
        ) : null}
        {showBack && onBack ? (
          <Button onClick={onBack} size={buttonSize} variant="ghost">
            <IconArrowLeft stroke={2} />
            {backLabel}
          </Button>
        ) : null}
      </div>

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
  );
}

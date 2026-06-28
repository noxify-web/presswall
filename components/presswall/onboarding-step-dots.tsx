import { cn } from "@/lib/utils";

interface OnboardingStepDotsProps {
  current: number;
  total: number;
}

function dotClassName(index: number, current: number) {
  if (index === current) {
    return "w-6 bg-foreground";
  }

  if (index < current) {
    return "bg-foreground/40";
  }

  return "bg-foreground/15";
}

export function OnboardingStepDots({
  current,
  total,
}: OnboardingStepDotsProps) {
  return (
    <div
      aria-label={`Step ${current + 1} of ${total}`}
      className="flex shrink-0 justify-center gap-2 pt-10"
      role="status"
    >
      {(["first", "second", "third"] as const)
        .slice(0, total)
        .map((stepId, index) => (
          <span
            className={cn(
              "size-1.5 rounded-full transition-all duration-300",
              dotClassName(index, current)
            )}
            key={stepId}
          />
        ))}
    </div>
  );
}

import { cn } from "@/lib/utils";

interface SkeletonBlockProps {
  className?: string;
}

/** Soft shimmer bone — prefer over raw gray boxes for loading shells. */
export function SkeletonBlock({ className }: SkeletonBlockProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("presswall-skeleton rounded-md", className)}
    />
  );
}

/** Press-logo row placeholder used inside preview canvas skeletons. */
export function SkeletonLogoStrip({ className }: SkeletonBlockProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex w-full max-w-xl items-center justify-center gap-5 rounded-lg border border-border/60 bg-card px-6 py-5 shadow-sm",
        className
      )}
    >
      <SkeletonBlock className="h-5 w-16 shrink-0 rounded-sm" />
      <SkeletonBlock className="h-5 w-12 shrink-0 rounded-sm opacity-80" />
      <SkeletonBlock className="h-5 w-20 shrink-0 rounded-sm" />
      <SkeletonBlock className="hidden h-5 w-14 shrink-0 rounded-sm opacity-80 sm:block" />
      <SkeletonBlock className="hidden h-5 w-16 shrink-0 rounded-sm md:block" />
      <SkeletonBlock className="hidden h-5 w-10 shrink-0 rounded-sm opacity-70 lg:block" />
    </div>
  );
}

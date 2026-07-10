import {
  SkeletonBlock,
  SkeletonLogoStrip,
} from "@/components/presswall/skeleton-block";

/** Standalone onboarding loading shell (centered wizard layout). */
export function OnboardingShellSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading onboarding"
      className="flex h-svh flex-col bg-background"
      role="status"
    >
      <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-6 pt-6 pb-6">
        <div className="flex w-full max-w-xl flex-1 flex-col gap-5">
          <div className="space-y-2 text-center">
            <SkeletonBlock className="mx-auto h-7 w-52 rounded-lg" />
            <SkeletonBlock className="mx-auto h-3.5 w-72 max-w-full" />
          </div>

          <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <SkeletonBlock className="h-9 min-w-0 flex-1 rounded-md" />
              <SkeletonBlock className="h-9 w-20 shrink-0 rounded-md" />
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              <SkeletonBlock className="aspect-[4/3] w-full rounded-lg" />
              <SkeletonBlock className="aspect-[4/3] w-full rounded-lg" />
              <SkeletonBlock className="aspect-[4/3] w-full rounded-lg" />
              <SkeletonBlock className="aspect-[4/3] w-full rounded-lg" />
              <SkeletonBlock className="aspect-[4/3] w-full rounded-lg" />
              <SkeletonBlock className="aspect-[4/3] w-full rounded-lg" />
              <SkeletonBlock className="aspect-[4/3] w-full rounded-lg" />
              <SkeletonBlock className="aspect-[4/3] w-full rounded-lg" />
            </div>
          </div>

          <div className="presswall-canvas-bg-dots flex flex-1 items-center justify-center rounded-xl border bg-card p-6 shadow-sm">
            <SkeletonLogoStrip className="max-w-md shadow-none" />
          </div>

          <div className="mt-auto flex items-center justify-between gap-4 pt-1">
            <SkeletonBlock className="h-8 w-20 rounded-md" />
            <div className="flex items-center gap-1.5">
              <SkeletonBlock className="h-1.5 w-6 rounded-full" />
              <SkeletonBlock className="size-1.5 rounded-full opacity-50" />
              <SkeletonBlock className="size-1.5 rounded-full opacity-40" />
            </div>
            <SkeletonBlock className="h-8 w-24 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

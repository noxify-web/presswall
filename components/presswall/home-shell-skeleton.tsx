import {
  SkeletonBlock,
  SkeletonLogoStrip,
} from "@/components/presswall/skeleton-block";

function OverviewCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="flex shrink-0 items-start justify-between gap-3 border-b px-4 py-3">
        <div className="min-w-0 flex-1 space-y-2">
          <SkeletonBlock className="h-3.5 w-28" />
          <SkeletonBlock className="h-3 w-full max-w-[14rem]" />
        </div>
        <SkeletonBlock className="mt-0.5 h-5 w-16 shrink-0 rounded-full" />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <SkeletonBlock className="h-3 w-32" />
        <div className="space-y-2">
          <SkeletonBlock className="h-3 w-full" />
          <SkeletonBlock className="h-3 w-[92%]" />
          <SkeletonBlock className="h-3 w-[78%]" />
        </div>
        <div className="mt-auto flex flex-wrap gap-2 pt-1">
          <SkeletonBlock className="h-8 w-32 rounded-md" />
          <SkeletonBlock className="h-8 w-28 rounded-md" />
        </div>
      </div>
    </div>
  );
}

/** Matches MerchantOverview layout while shop config loads. */
export function HomeShellSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading home"
      className="flex h-svh flex-col overflow-hidden bg-background"
      role="status"
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pt-4 pb-6 sm:px-6">
        <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-3">
          {/* Storefront preview card */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-2.5">
              <SkeletonBlock className="h-3.5 w-36" />
              <div className="flex items-center gap-2">
                <div className="flex overflow-hidden rounded-md border border-border/70 p-0.5">
                  <SkeletonBlock className="h-7 w-8 rounded-sm" />
                  <SkeletonBlock className="h-7 w-8 rounded-sm opacity-50" />
                </div>
                <SkeletonBlock className="h-8 w-28 rounded-md" />
              </div>
            </div>

            <div className="presswall-canvas-bg-dots relative flex min-h-0 flex-1 items-center justify-center p-6">
              <SkeletonLogoStrip />
            </div>
          </div>

          {/* Embed + placement cards */}
          <div className="grid shrink-0 items-stretch gap-3 md:grid-cols-2">
            <OverviewCardSkeleton />
            <OverviewCardSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}

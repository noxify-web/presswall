import {
  SkeletonBlock,
  SkeletonLogoStrip,
} from "@/components/presswall/skeleton-block";

function StyleControlSkeleton() {
  return (
    <div className="space-y-2">
      <SkeletonBlock className="h-3 w-20" />
      <SkeletonBlock className="h-9 w-full rounded-md" />
    </div>
  );
}

/** Matches EditorWorkspace layout while shop config loads. */
export function EditorShellSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading editor"
      className="flex h-svh flex-col overflow-hidden bg-background"
      role="status"
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pt-4 pb-6 sm:px-6">
        <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-3">
          <div className="flex min-h-0 flex-1 gap-4">
            {/* Live preview */}
            <div className="flex min-h-0 min-w-0 flex-[3] flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
              <div className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-2.5">
                <SkeletonBlock className="h-3.5 w-24" />
                <div className="flex items-center gap-2">
                  <div className="flex overflow-hidden rounded-md border border-border/70 p-0.5">
                    <SkeletonBlock className="h-7 w-8 rounded-sm" />
                    <SkeletonBlock className="h-7 w-8 rounded-sm opacity-50" />
                  </div>
                  <SkeletonBlock className="h-8 w-16 rounded-md" />
                  <SkeletonBlock className="h-8 w-16 rounded-md" />
                </div>
              </div>

              <div className="presswall-canvas-bg-dots relative flex min-h-0 flex-1 items-center justify-center p-6">
                <SkeletonLogoStrip className="max-w-2xl" />
              </div>
            </div>

            {/* Side panel — Style / Outlets / Templates */}
            <div className="flex min-h-0 min-w-0 flex-[2] flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
              <div className="shrink-0 border-b p-3">
                <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
                  <SkeletonBlock className="h-8 rounded-md bg-card shadow-sm" />
                  <SkeletonBlock className="h-8 rounded-md opacity-40" />
                  <SkeletonBlock className="h-8 rounded-md opacity-40" />
                </div>
              </div>

              <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-3">
                <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
                  <StyleControlSkeleton />
                  <StyleControlSkeleton />
                  <div className="space-y-2">
                    <SkeletonBlock className="h-3 w-24" />
                    <div className="flex gap-2">
                      <SkeletonBlock className="h-9 flex-1 rounded-md" />
                      <SkeletonBlock className="h-9 flex-1 rounded-md" />
                      <SkeletonBlock className="h-9 flex-1 rounded-md" />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
                  <StyleControlSkeleton />
                  <div className="space-y-2">
                    <SkeletonBlock className="h-3 w-16" />
                    <SkeletonBlock className="h-2 w-full rounded-full" />
                  </div>
                  <div className="space-y-2">
                    <SkeletonBlock className="h-3 w-20" />
                    <SkeletonBlock className="h-2 w-full rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

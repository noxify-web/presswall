export function OnboardingShellSkeleton() {
  return (
    <div className="flex h-svh flex-col bg-background">
      <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-6 pt-4">
        <div className="flex w-full max-w-xl flex-1 flex-col gap-6">
          <div className="mx-auto h-8 w-56 animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-full animate-pulse rounded bg-muted/60" />
          <div className="h-28 animate-pulse rounded-xl bg-muted/40" />
          <div className="h-40 animate-pulse rounded-xl bg-muted/30" />
          <div className="mt-auto flex items-center justify-between gap-4 pt-2">
            <div className="h-8 w-20 animate-pulse rounded-md bg-muted/40" />
            <div className="flex gap-1.5">
              <span className="h-1.5 w-6 animate-pulse rounded-full bg-muted" />
              <span className="size-1.5 animate-pulse rounded-full bg-muted/60" />
              <span className="size-1.5 animate-pulse rounded-full bg-muted/40" />
            </div>
            <div className="h-8 w-24 animate-pulse rounded-md bg-muted/40" />
          </div>
        </div>
      </div>
    </div>
  );
}

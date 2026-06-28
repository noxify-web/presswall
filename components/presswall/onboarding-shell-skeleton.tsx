export function OnboardingShellSkeleton() {
  return (
    <div className="flex h-svh flex-col bg-background">
      <div className="flex justify-center gap-2 pt-10">
        <span className="h-1.5 w-6 animate-pulse rounded-full bg-muted" />
        <span className="size-1.5 animate-pulse rounded-full bg-muted/60" />
        <span className="size-1.5 animate-pulse rounded-full bg-muted/40" />
      </div>
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-xl space-y-6">
          <div className="mx-auto h-8 w-56 animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-full animate-pulse rounded bg-muted/60" />
          <div className="h-28 animate-pulse rounded-xl bg-muted/40" />
          <div className="h-40 animate-pulse rounded-xl bg-muted/30" />
        </div>
      </div>
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl bg-bg-card border border-border p-4">
      <Skeleton className="aspect-[2.5/3.5] w-full mb-3" />
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-3 w-1/2 mb-3" />
      <div className="flex justify-between">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-4 w-12" />
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="rounded-xl bg-bg-card border border-border p-4">
      <div className="flex justify-between mb-4">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-1">
          <Skeleton className="h-7 w-10 rounded-md" />
          <Skeleton className="h-7 w-10 rounded-md" />
          <Skeleton className="h-7 w-10 rounded-md" />
        </div>
      </div>
      <Skeleton className="h-[280px] w-full" />
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Skeleton className="h-4 w-32 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-xl bg-bg-card border border-border p-6">
            <Skeleton className="aspect-[2.5/3.5] w-full max-w-[280px] mx-auto" />
          </div>
          <div className="rounded-xl bg-bg-card border border-border p-4 space-y-3">
            <Skeleton className="h-5 w-48" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          </div>
        </div>
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl bg-bg-card border border-border p-4">
            <Skeleton className="h-8 w-32 mb-1" />
            <Skeleton className="h-4 w-24" />
          </div>
          <ChartSkeleton />
        </div>
      </div>
    </div>
  );
}

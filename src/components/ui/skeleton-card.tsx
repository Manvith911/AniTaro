export function SkeletonCard() {
  return (
    <div className="rounded-lg overflow-hidden">
      <div className="aspect-[3/4] shimmer" />
      <div className="p-2 space-y-2">
        <div className="h-4 w-3/4 shimmer rounded" />
        <div className="h-3 w-1/2 shimmer rounded" />
      </div>
    </div>
  );
}

export function SkeletonSpotlight() {
  return (
    <div className="relative w-full h-[70vh] min-h-[500px] max-h-[800px] shimmer">
      <div className="absolute inset-0 flex items-center">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl space-y-4">
            <div className="h-8 w-32 bg-muted/50 rounded-full" />
            <div className="h-16 w-3/4 bg-muted/50 rounded" />
            <div className="h-4 w-1/2 bg-muted/50 rounded" />
            <div className="h-20 w-full bg-muted/50 rounded" />
            <div className="flex gap-4">
              <div className="h-12 w-32 bg-muted/50 rounded-lg" />
              <div className="h-12 w-32 bg-muted/50 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonSection() {
  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-48 shimmer rounded" />
        <div className="h-6 w-20 shimmer rounded" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </section>
  );
}

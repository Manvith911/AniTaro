export function SkeletonCard() {
  return (
    <div className="rounded-xl overflow-hidden animate-fade-in">
      <div className="aspect-[3/4] shimmer rounded-xl" />
      <div className="pt-3 space-y-2">
        <div className="h-4 w-3/4 shimmer rounded-md" />
        <div className="h-3 w-1/2 shimmer rounded-md" />
      </div>
    </div>
  );
}

export function SkeletonSpotlight() {
  return (
    <div className="relative w-full h-[70vh] min-h-[500px] max-h-[800px] shimmer">
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      <div className="absolute inset-0 flex items-center">
        <div className="w-full px-6 md:px-10 lg:px-16">
          <div className="max-w-2xl space-y-4">
            <div className="flex gap-3">
              <div className="h-7 w-32 bg-muted/40 rounded-full" />
              <div className="h-7 w-16 bg-muted/40 rounded-full" />
            </div>
            <div className="space-y-2">
              <div className="h-12 w-4/5 bg-muted/40 rounded-lg" />
              <div className="h-12 w-3/5 bg-muted/40 rounded-lg" />
            </div>
            <div className="flex gap-3 text-sm">
              <div className="h-4 w-14 bg-muted/30 rounded" />
              <div className="h-4 w-20 bg-muted/30 rounded" />
              <div className="h-4 w-16 bg-muted/30 rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-muted/30 rounded" />
              <div className="h-4 w-5/6 bg-muted/30 rounded" />
              <div className="h-4 w-2/3 bg-muted/30 rounded" />
            </div>
            <div className="flex gap-4 pt-2">
              <div className="h-12 w-36 bg-muted/40 rounded-xl" />
              <div className="h-12 w-28 bg-muted/40 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
      {/* Dots skeleton */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full bg-muted/30 ${i === 0 ? 'w-8' : 'w-1.5'}`} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonSection() {
  return (
    <section className="py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="h-7 w-48 shimmer rounded-lg" />
        <div className="h-5 w-20 shimmer rounded-lg" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </section>
  );
}

export function SkeletonDetails() {
  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <div className="h-[50vh] shimmer" />
      <div className="container mx-auto px-4 -mt-32 relative z-10">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-48 md:w-64 h-80 md:h-96 shimmer rounded-xl flex-shrink-0 mx-auto md:mx-0" />
          <div className="flex-1 space-y-4">
            <div className="h-10 w-3/4 shimmer rounded-lg" />
            <div className="h-5 w-1/3 shimmer rounded-lg" />
            <div className="flex gap-3">
              <div className="h-8 w-16 shimmer rounded-full" />
              <div className="h-8 w-20 shimmer rounded-full" />
              <div className="h-8 w-14 shimmer rounded-full" />
            </div>
            <div className="space-y-2 pt-2">
              <div className="h-4 w-full shimmer rounded" />
              <div className="h-4 w-5/6 shimmer rounded" />
              <div className="h-4 w-4/6 shimmer rounded" />
              <div className="h-4 w-3/6 shimmer rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonWatch() {
  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-4 w-12 shimmer rounded" />
        <div className="h-4 w-4 shimmer rounded" />
        <div className="h-4 w-32 shimmer rounded" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="aspect-video shimmer rounded-xl" />
          <div className="flex justify-between">
            <div className="h-10 w-28 shimmer rounded-lg" />
            <div className="h-4 w-24 shimmer rounded" />
            <div className="h-10 w-28 shimmer rounded-lg" />
          </div>
          <div className="p-4 bg-card rounded-xl space-y-3">
            <div className="h-5 w-24 shimmer rounded" />
            <div className="flex gap-2">
              <div className="h-8 w-16 shimmer rounded-lg" />
              <div className="h-8 w-16 shimmer rounded-lg" />
            </div>
          </div>
        </div>
        <div className="lg:col-span-1">
          <div className="h-7 w-24 shimmer rounded-lg mb-4" />
          <div className="bg-card rounded-xl p-3 space-y-2">
            <div className="h-10 shimmer rounded-lg" />
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 shimmer rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

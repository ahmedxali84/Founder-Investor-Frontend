/** Shimmering placeholder block/line/circle — swap in wherever a bare spinner used to sit over blank space. */
export function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} />
}

/** A full-page skeleton mimicking the AppShell layout, for the initial data-loading moment on Dashboard/Matches/Profile. */
export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex font-sans">
      <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 shrink-0 hidden md:block p-5 space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-xl" />
          <Skeleton className="w-24 h-4" />
        </div>
        <div className="space-y-2.5 pt-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="w-full h-8 rounded-xl" />
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        <div className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-6 flex items-center justify-between">
          <Skeleton className="w-64 h-8 rounded-xl" />
          <Skeleton className="w-32 h-8 rounded-xl" />
        </div>
        <div className="p-6 space-y-6">
          <Skeleton className="w-56 h-7" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-3xl" />
        </div>
      </div>
    </div>
  )
}

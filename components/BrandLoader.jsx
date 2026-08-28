/**
 * Full-page loading screen — replaces the old bare-spinner loaders (a
 * hardcoded purple gradient in ProtectedRoute that didn't match the app at
 * all, and a plain SpinnerIcon everywhere else) with the actual Kavan mark:
 * the pineapple icon centered in a spinning ring (the app's real accent
 * color, same one every button/focus-ring already uses — not a one-off
 * color), gently pulsing so it reads as "alive" rather than just a static
 * logo sitting on screen.
 */
export default function BrandLoader({ message = 'Loading…' }) {
  return (
    <div className="min-h-screen bg-cream dark:bg-slate-950 flex flex-col items-center justify-center gap-5">
      <div className="relative w-20 h-20 shrink-0">
        <div className="absolute inset-0 rounded-full border-[3px] border-slate-200/70 dark:border-slate-800" />
        <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-brand animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <img src="/icon-light.png" alt="" className="w-9 h-9 dark:hidden animate-pulse" />
          <img src="/icon-dark.png" alt="" className="w-9 h-9 hidden dark:block animate-pulse" />
        </div>
      </div>
      <p className="text-sm font-semibold text-muted dark:text-slate-400">{message}</p>
    </div>
  )
}

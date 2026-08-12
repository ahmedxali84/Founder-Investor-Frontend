const BAR_COLOR = {
  1: 'bg-red-400',
  2: 'bg-amber-400',
  3: 'bg-emerald-500',
  4: 'bg-emerald-500',
}

/** The 4-bar strength meter, shared by SignupForm and ResetPassword so both flows look identical. */
export default function PasswordStrengthMeter({ strength }) {
  if (!strength || strength.bars === 0) return null
  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="flex gap-1" aria-hidden="true">
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={`h-1 w-6 rounded-full ${i <= strength.bars ? BAR_COLOR[strength.bars] : 'bg-gray-200 dark:bg-slate-700'}`}
          />
        ))}
      </div>
      <p className="text-[11.5px] text-muted dark:text-slate-400">
        Password strength: <span className={`font-semibold ${strength.color}`}>{strength.label}</span>
      </p>
    </div>
  )
}

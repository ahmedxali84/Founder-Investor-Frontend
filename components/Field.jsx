'use client'

import { useState } from 'react'
import { EyeIcon } from './icons.jsx'

export default function Field({
  id,
  label,
  type = 'text',
  icon,
  error,
  value,
  onChange,
  placeholder,
  autoComplete,
  disabled,
}) {
  const [reveal, setReveal] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword && reveal ? 'text' : type

  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <div className={`field-shell ${error ? 'border-red-400 dark:border-red-500/60 focus-within:border-red-400 focus-within:ring-red-100 dark:focus-within:ring-red-500/10' : ''}`}>
        <span className="text-gray-400 dark:text-slate-400 shrink-0">{icon}</span>
        <input
          id={id}
          name={id}
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="field-input"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            className="text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-300 shrink-0"
            aria-label={reveal ? 'Hide password' : 'Show password'}
          >
            <EyeIcon open={!reveal} />
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-[12px] font-medium text-red-500">
          {error}
        </p>
      )}
    </div>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'

// Pre-visible starting transform per variant, so different sections can read
// as distinct motion (a boxed card popping in vs. two panels sliding apart
// from the center) instead of five identical fade-up reveals in a row.
const HIDDEN = {
  up: 'opacity-0 translate-y-6',
  left: 'opacity-0 -translate-x-6',
  right: 'opacity-0 translate-x-6',
  scale: 'opacity-0 scale-95',
}
const VISIBLE = 'opacity-100 translate-y-0 translate-x-0 scale-100'

/**
 * Reveals content in the moment it scrolls into view, once, via a plain
 * IntersectionObserver (no animation library). `prefers-reduced-motion` is
 * already handled globally in globals.css (every transition-duration
 * collapses to ~0), so this needs no separate reduced-motion branch of its
 * own.
 */
export default function Reveal({ children, className = '', delay = 0, variant = 'up', as: Tag = 'div', ...rest }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <Tag
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? VISIBLE : HIDDEN[variant]} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  )
}

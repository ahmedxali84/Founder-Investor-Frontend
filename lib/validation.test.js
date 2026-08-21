import { describe, it, expect } from 'vitest'
import { isSafeHttpUrl, safeHref } from './validation.js'

// Regression coverage for the stored-XSS fix found during the strict
// security audit: mvp_url/repo_url/screenshot_url are founder-submitted and
// get rendered as a real <a href>/<img src> for other users (investors
// browsing shortlists). `<input type="url">` only validates syntax, not
// scheme, so a `javascript:`/`data:` value passed the form untouched and
// executed in the browser of whoever clicked it.

describe('isSafeHttpUrl', () => {
  it('accepts http and https URLs', () => {
    expect(isSafeHttpUrl('https://example.com')).toBe(true)
    expect(isSafeHttpUrl('http://example.com/path?q=1')).toBe(true)
  })

  it('rejects javascript: URLs', () => {
    expect(isSafeHttpUrl('javascript:alert(document.cookie)')).toBe(false)
  })

  it('rejects data: URLs', () => {
    expect(isSafeHttpUrl('data:text/html,<script>alert(1)</script>')).toBe(false)
  })

  it('rejects other non-http(s) schemes', () => {
    expect(isSafeHttpUrl('file:///etc/passwd')).toBe(false)
    expect(isSafeHttpUrl('vbscript:msgbox(1)')).toBe(false)
  })

  it('rejects malformed input', () => {
    expect(isSafeHttpUrl('')).toBe(false)
    expect(isSafeHttpUrl(null)).toBe(false)
    expect(isSafeHttpUrl(undefined)).toBe(false)
    expect(isSafeHttpUrl('not a url')).toBe(false)
  })
})

describe('safeHref', () => {
  it('passes through a safe URL unchanged', () => {
    expect(safeHref('https://example.com')).toBe('https://example.com')
  })

  it('returns undefined for an unsafe URL, so React omits the attribute entirely', () => {
    expect(safeHref('javascript:alert(1)')).toBeUndefined()
  })

  it('returns undefined for empty/missing input', () => {
    expect(safeHref('')).toBeUndefined()
    expect(safeHref(null)).toBeUndefined()
  })
})

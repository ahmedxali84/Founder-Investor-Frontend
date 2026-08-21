import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Regression coverage for a real production bug found while investigating a
// "resume download doesn't work" report: downloadAuthenticated() called
// fetch(path, ...) directly on a backend-relative path like
// "/api/resume/{id}" (exactly what resume_url comes back as). In production
// that resolves against the FRONTEND's own origin (Vercel), not the
// backend — the request 404'd against Vercel and never reached the backend
// at all (confirmed live: zero matching requests in the backend's logs).
// Fixed by prefixing any non-absolute path with API_BASE (the bare backend
// origin) before fetching.

if (typeof URL.createObjectURL !== 'function') {
  URL.createObjectURL = () => 'blob:mock-url'
}
if (typeof URL.revokeObjectURL !== 'function') {
  URL.revokeObjectURL = () => {}
}

describe('downloadAuthenticated', () => {
  const originalEnv = process.env.NEXT_PUBLIC_API_URL

  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_URL = originalEnv
    vi.unstubAllGlobals()
  })

  it('prefixes a backend-relative path with the backend origin in production (NEXT_PUBLIC_API_URL set)', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://founder-investor-backend.onrender.com/api'
    const { downloadAuthenticated } = await import('./apiClient.js')

    let requestedUrl = null
    global.fetch = vi.fn((url) => {
      requestedUrl = url
      return Promise.resolve({
        ok: true,
        blob: () => Promise.resolve(new Blob(['fake docx bytes'])),
      })
    })

    await downloadAuthenticated('/api/resume/user123', 'fake-token', 'resume.docx')

    expect(requestedUrl).toBe('https://founder-investor-backend.onrender.com/api/resume/user123')
  })

  it('leaves an already-absolute URL untouched', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://founder-investor-backend.onrender.com/api'
    const { downloadAuthenticated } = await import('./apiClient.js')

    let requestedUrl = null
    global.fetch = vi.fn((url) => {
      requestedUrl = url
      return Promise.resolve({ ok: true, blob: () => Promise.resolve(new Blob(['x'])) })
    })

    await downloadAuthenticated('https://example.com/some/absolute/file.docx', 'fake-token', 'file.docx')

    expect(requestedUrl).toBe('https://example.com/some/absolute/file.docx')
  })

  it('throws a clear error when the response is not ok', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://founder-investor-backend.onrender.com/api'
    const { downloadAuthenticated } = await import('./apiClient.js')

    global.fetch = vi.fn(() => Promise.resolve({ ok: false, status: 404 }))

    await expect(downloadAuthenticated('/api/resume/missing', 'fake-token', 'resume.docx'))
      .rejects.toThrow("Couldn't download the file")
  })
})

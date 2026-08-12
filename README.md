# Techflix — Login & Signup (React + Node + Tailwind + Supabase)


---

## 1. Install

Requires Node 18 or newer.

```bash
cd techflix-auth
npm install
```

## 2. Add the keys (do this when your team lead sends them)

```bash
cp .env.example .env.local     # frontend keys
cp .env.example .env           # backend keys
```

Then open both files and fill in:

| Variable | Where it comes from |
|---|---|
| `VITE_SUPABASE_URL` / `SUPABASE_URL` | Supabase → Project Settings → API → **Project URL** |
| `VITE_SUPABASE_ANON_KEY` / `SUPABASE_ANON_KEY` | Same page → **anon public** key |

Nothing is hard-coded anywhere — every key is read from env. Restart the dev server
after editing (Vite only reads env at startup).

**Until the keys arrive the app still runs.** You'll see an amber banner on the card
and auth actions return a clear message instead of crashing, so you can review the
design right away.

## 3. Run

Two terminals:

```bash
npm run dev       # React app  → http://localhost:5173
npm run server    # Express API → http://localhost:4000
```

`/api` is proxied from Vite to the Node server, so no CORS wrangling in dev.

## 4. Supabase dashboard settings

1. **Authentication → Providers → Email** — turn "Confirm email" on or off.
   Both paths are already handled: with it **on**, signup shows a "check your inbox"
   message; with it **off**, the user is logged in immediately and sent to `/dashboard`.
2. **Authentication → Providers → Google** — enable it, paste your Google OAuth
   client ID and secret, and copy Supabase's callback URL into the Google Cloud
   console under *Authorised redirect URIs*.
3. **Authentication → URL Configuration** — set Site URL to `http://localhost:5173`
   and add `http://localhost:5173/**` to Redirect URLs (add the production domain later).
4. Optional but recommended: run `supabase/schema.sql` in the SQL Editor. It creates a
   `profiles` table keyed to `auth.users.id` with row-level security, plus a trigger
   that copies the signup name across. That's the `user_id` link the agent dashboard needs.

---

## What's built

| Requirement from the task | Where |
|---|---|
| Single shared Supabase client | `src/lib/supabaseClient.js` |
| Keys in env, never in components | `.env.example`, `import.meta.env` |
| Signup form (name, email, password) | `src/components/SignupForm.jsx` |
| Login form with clear error messages | `src/components/LoginForm.jsx` |
| `signUp` / `signInWithPassword` / `signInWithOAuth` / `signOut` | `src/context/AuthContext.jsx` |
| Session survives refresh | `getSession()` + `onAuthStateChange` in `AuthContext` |
| Protected routes → redirect to login | `src/components/ProtectedRoute.jsx`, `/dashboard` |
| Validation: empty fields, bad email, short password, duplicate signup | `src/lib/validation.js` |
| Password strength meter | `passwordStrength()` in `src/lib/validation.js` |
| Server-side session confirmation | `server/index.js` → `GET /api/me` |
| Forgot / reset password | `src/pages/ForgotPassword.jsx`, `ResetPassword.jsx` |

### Routes

| Path | Access |
|---|---|
| `/` | Public — login + signup card |
| `/forgot-password` | Public |
| `/reset-password` | Opened from the reset email |
| `/dashboard` | Protected — redirects to `/` with no session |

### Test the full flow

Sign up → (confirm email if enabled) → log in → hit **Call /api/me** on the dashboard →
refresh the page (still logged in) → log out → try visiting `/dashboard` directly
(bounces back to login).

---

## Project structure

```
techflix-auth/
├── index.html
├── vite.config.js          # /api proxy → Node server
├── tailwind.config.js      # brand palette + shadows
├── .env.example
├── supabase/schema.sql     # profiles table + trigger
├── server/index.js         # Express, verifies Bearer token with Supabase
└── src/
    ├── App.jsx
    ├── main.jsx
    ├── index.css           # Tailwind + shared field/button classes
    ├── lib/
    │   ├── supabaseClient.js
    │   └── validation.js
    ├── context/AuthContext.jsx
    ├── components/
    │   ├── BrandPanel.jsx  HeroIllustration.jsx  icons.jsx
    │   ├── LoginForm.jsx   SignupForm.jsx        Field.jsx
    │   └── Notice.jsx      ProtectedRoute.jsx
    └── pages/
        ├── AuthPage.jsx    Dashboard.jsx
        └── ForgotPassword.jsx  ResetPassword.jsx
```

## Notes for the team

- The `anon` key is meant to be public — safety comes from row-level security, so
  keep RLS on for every table.
- Never put `SUPABASE_SERVICE_ROLE_KEY` in a `VITE_` variable. It belongs only in
  `server/.env`, and only if you later need admin operations.
- On screens narrower than `md`, the two panels collapse into tabs; above that both
  are shown side by side exactly as in the design.

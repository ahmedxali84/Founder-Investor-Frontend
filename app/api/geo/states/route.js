import { State } from 'country-state-city'

// Same reasoning as ../countries/route.js — kept server-side so the
// package's bundled dataset never reaches the client.
export async function GET(request) {
  const countryIso = request.nextUrl.searchParams.get('country') || ''
  if (!countryIso) return Response.json([])
  const states = State.getStatesOfCountry(countryIso)
    .map((s) => ({ name: s.name, isoCode: s.isoCode }))
    .sort((a, b) => a.name.localeCompare(b.name))
  return Response.json(states)
}

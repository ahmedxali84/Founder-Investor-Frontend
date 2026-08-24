import { City } from 'country-state-city'

// Same reasoning as ../countries/route.js. "District" in the onboarding form
// means major city, not an official administrative district — City is the
// right granularity here, not a separate (much sparser) districts dataset.
export async function GET(request) {
  const countryIso = request.nextUrl.searchParams.get('country') || ''
  const stateIso = request.nextUrl.searchParams.get('state') || ''
  if (!countryIso || !stateIso) return Response.json([])
  const names = City.getCitiesOfState(countryIso, stateIso).map((c) => c.name)
  const unique = [...new Set(names)].sort((a, b) => a.localeCompare(b))
  return Response.json(unique)
}

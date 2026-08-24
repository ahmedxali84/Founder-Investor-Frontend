import { Country } from 'country-state-city'

// country-state-city's dataset is ~17MB unpacked (city.json alone is ~7.7MB)
// — importing it in a 'use client' component would ship that straight into
// the browser bundle. Kept server-side in a route handler instead: only the
// small slice actually needed for one cascading step goes over the wire.
export async function GET() {
  const countries = Country.getAllCountries()
    .map((c) => ({ name: c.name, isoCode: c.isoCode }))
    .sort((a, b) => a.name.localeCompare(b.name))
  return Response.json(countries)
}

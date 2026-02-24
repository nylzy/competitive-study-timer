import universities from '../../../lib/universities.json'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')?.toLowerCase()

  if (!query || query.length < 2) {
    return Response.json([])
  }

  const starts = universities
    .filter(u => u.name.toLowerCase().startsWith(query))
    .slice(0, 8)

  const includes = universities
    .filter(u =>
      u.name.toLowerCase().includes(query) &&
      !u.name.toLowerCase().startsWith(query)
    )
    .slice(0, 8 - starts.length)

  const results = [...starts, ...includes].map(u => u.name)

  return Response.json(results)
}
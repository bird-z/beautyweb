import { corsHeaders } from '../_lib/public'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  return Response.json({ ok: true }, { headers: corsHeaders(request) })
}

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) })
}

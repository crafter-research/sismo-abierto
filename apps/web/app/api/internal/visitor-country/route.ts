export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return Response.json(
    { country: request.headers.get("x-vercel-ip-country") },
    { headers: { "cache-control": "private, no-store" } },
  );
}

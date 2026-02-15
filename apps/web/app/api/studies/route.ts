import { NextResponse } from "next/server";

const API = process.env.API_INTERNAL_URL || "http://api:8000";

export async function POST(req: Request) {
  const body = await req.text();

  const r = await fetch(`${API}/studies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  const contentType = r.headers.get("content-type") || "application/json";
  const data = await r.arrayBuffer();

  return new NextResponse(data, {
    status: r.status,
    headers: { "Content-Type": contentType },
  });
}

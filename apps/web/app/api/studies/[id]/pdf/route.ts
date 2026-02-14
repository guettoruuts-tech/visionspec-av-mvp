import { NextResponse } from "next/server";

const API = process.env.API_INTERNAL_URL || "http://api:8000";

export async function GET(_req: Request, ctx: any) {
  const { id } = ctx.params;

  const r = await fetch(`${API}/studies/${id}/pdf`, { method: "GET" });
  const data = await r.arrayBuffer();

  const headers = new Headers();
  headers.set("Content-Type", r.headers.get("content-type") || "application/pdf");
  headers.set(
    "Content-Disposition",
    r.headers.get("content-disposition") || `inline; filename="study-${id}.pdf"`,
  );

  return new NextResponse(data, { status: r.status, headers });
}

import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

  try {
    const res = await fetch(`${BACKEND_URL}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: "Server Backend tidak merespon" }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

export async function POST(request) {
  try {
    const body = await request.json();

    // Validate input
    if (!body.code || !body.language) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields: code, language' },
        { status: 400 }
      );
    }

    // Proxy to Python FastAPI backend
    const response = await fetch(`${PYTHON_BACKEND_URL}/api/complexity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { ok: false, error: errorData.detail || 'Backend error' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ ok: true, analysis: data });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

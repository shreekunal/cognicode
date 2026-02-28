import { NextResponse } from 'next/server';

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

export async function POST(request) {
    try {
        const body = await request.json();

        if (!body.problemTitle || !body.problemStatement) {
            return NextResponse.json(
                { ok: false, error: 'Missing required fields: problemTitle, problemStatement' },
                { status: 400 }
            );
        }

        const response = await fetch(`${PYTHON_BACKEND_URL}/api/hint`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
        return NextResponse.json({ ok: true, ...data });
    } catch (err) {
        return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
    }
}

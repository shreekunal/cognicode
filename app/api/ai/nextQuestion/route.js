import { NextResponse } from 'next/server';

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

export async function POST(request) {
  try {
    const body = await request.json();

    // Ensure the body has the expected structure for the Python backend
    const payload = {
      userStats: {
        accuracy: body.userStats?.accuracy || 0,
        recentWeightedAccuracy: body.userStats?.recentWeightedAccuracy || body.userStats?.accuracy || 0,
        problemsSolved: body.userStats?.problemsSolved || 0,
        avgTime: body.userStats?.avgTime || 0,
        lastDifficulty: body.userStats?.lastDifficulty || "Easy",
        solvedProblemIds: body.userStats?.solvedProblemIds || [],
        solvedCategories: body.userStats?.solvedCategories || {},
        totalSubmissions: body.userStats?.totalSubmissions || 0,
        totalAccepted: body.userStats?.totalAccepted || 0,
        recentDifficulty: body.userStats?.recentDifficulty || "Easy",
        rating: body.userStats?.rating || 50,
        recentSubmissions: body.userStats?.recentSubmissions || [],
        stuckCategories: body.userStats?.stuckCategories || [],
      }
    };

    // Proxy to Python FastAPI backend
    const response = await fetch(`${PYTHON_BACKEND_URL}/api/recommend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ ok: false, error: errorData.detail || 'Backend error' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ ok: true, suggestion: data });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

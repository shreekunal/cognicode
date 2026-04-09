import { NextResponse } from 'next/server';

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

function parseJsonFromReply(reply) {
    if (!reply || typeof reply !== 'string') return null;

    const direct = (() => {
        try {
            return JSON.parse(reply);
        } catch {
            return null;
        }
    })();
    if (direct) return direct;

    const start = reply.indexOf('{');
    const end = reply.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return null;

    try {
        return JSON.parse(reply.slice(start, end + 1));
    } catch {
        return null;
    }
}

function buildFallback(results) {
    const total = Math.max(1, results.length);
    const accepted = results.filter((r) => r.accepted).length;
    const problemSolving = Math.round((accepted / total) * 100);
    const avgTime = Math.round(results.reduce((sum, r) => sum + (r.timeTakenSec || 0), 0) / total);
    const codeQuality = Math.max(40, Math.min(95, Math.round(problemSolving * 0.65 + (100 - Math.min(avgTime, 1800) / 18) * 0.35)));
    const communication = 70;
    const timeManagement = Math.max(30, Math.min(95, 100 - Math.round(avgTime / 20)));
    const overall = Math.round((problemSolving + codeQuality + communication + timeManagement) / 4);

    return {
        summary: 'AI response unavailable, generated scorecard from round performance.',
        overall,
        metrics: {
            problemSolving,
            codeQuality,
            communication,
            timeManagement,
        },
        strengths: problemSolving >= 67
            ? ['Good correctness under time pressure', 'Solid adaptation through rounds']
            : ['Stayed consistent across the full interview'],
        improvements: problemSolving < 67
            ? ['Practice deriving brute force before optimization', 'Review edge-case checklist before submitting']
            : ['Add complexity explanation before coding', 'Reduce hint usage in strict mode'],
        nextWeekPlan: [
            'Day 1-2: Solve 2 easy timed problems with no hints.',
            'Day 3-4: Solve 2 medium problems and write a short postmortem for each.',
            'Day 5-6: Mixed round (1 medium + 1 hard).',
            'Day 7: Full mock interview and compare score deltas.',
        ],
        followUps: [
            'How would you explain your latest solution to a non-technical interviewer?',
            'What edge case would most likely break your current approach?',
        ],
    };
}

export async function POST(request) {
    try {
        const body = await request.json();
        const results = Array.isArray(body?.results) ? body.results : [];

        if (results.length === 0) {
            return NextResponse.json({ ok: false, error: 'Missing required field: results[]' }, { status: 400 });
        }

        const systemPrompt = `You are a senior coding interviewer. Return STRICT JSON only with this schema: {\n  \"summary\": string,\n  \"overall\": number,\n  \"metrics\": {\n    \"problemSolving\": number,\n    \"codeQuality\": number,\n    \"communication\": number,\n    \"timeManagement\": number\n  },\n  \"strengths\": string[],\n  \"improvements\": string[],\n  \"nextWeekPlan\": string[],\n  \"followUps\": string[]\n}\nAll metric values and overall must be integers in [0,100].`;

        const userPrompt = `Build an interview scorecard from this round data:\n${JSON.stringify(results)}\n\nRequirements:\n- Keep summary under 45 words\n- Provide 2-4 strengths\n- Provide 2-4 improvements\n- Provide exactly 4 items in nextWeekPlan\n- Provide exactly 2 followUps`;

        const response = await fetch(`${PYTHON_BACKEND_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
            }),
        });

        if (!response.ok) {
            return NextResponse.json({ ok: true, scorecard: buildFallback(results) });
        }

        const data = await response.json();
        const parsed = parseJsonFromReply(data?.reply);

        if (!parsed) {
            return NextResponse.json({ ok: true, scorecard: buildFallback(results) });
        }

        return NextResponse.json({ ok: true, scorecard: parsed });
    } catch (err) {
        return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
    }
}

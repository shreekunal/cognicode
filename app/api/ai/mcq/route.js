import { NextResponse } from 'next/server';

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

function pickTopic(topics, index) {
  if (!Array.isArray(topics) || topics.length === 0) return 'Data Structures';
  return topics[index % topics.length];
}

function buildFallbackQuestions(topics, count, difficulty) {
  const normalizedDifficulty = String(difficulty || 'Medium');

  return Array.from({ length: count }, (_, index) => {
    const topic = pickTopic(topics, index);
    const emphasis = normalizedDifficulty.toLowerCase();

    const difficultyHint = emphasis.includes('hard')
      ? 'On hard problems, interviewers look for structured tradeoff reasoning and clean edge-case handling.'
      : emphasis.includes('easy')
        ? 'On easy problems, clarity and correctness matter more than premature optimization.'
        : 'For medium problems, explain your baseline approach before discussing optimizations.';

    return {
      question: `For ${topic} at ${normalizedDifficulty} level, which choice is the best interview answer when balancing correctness and implementation tradeoffs?`,
      options: {
        A: `Always choose the most complex approach because it is most impressive for ${topic}.`,
        B: `Start with the simplest correct approach, then optimize only if the constraints require it.`,
        C: `Skip edge-case analysis to save time during the interview.`,
        D: `Focus only on syntax and ignore the underlying problem structure.`,
      },
      correctOption: 'B',
      explanation: `The best interview strategy for ${topic} is to begin with a correct baseline, then improve it if needed. ${difficultyHint}`,
    };
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const topics = Array.isArray(body.topics) && body.topics.length > 0 ? body.topics : ['Data Structures'];
    const count = Number.isFinite(Number(body.count)) ? Math.max(1, Math.min(50, Number(body.count))) : 5;
    const difficulty = body.difficulty || 'Medium';

    const response = await fetch(`${PYTHON_BACKEND_URL}/api/mcq`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topics,
        count,
        difficulty,
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ ok: true, questions: buildFallbackQuestions(topics, count, difficulty), source: 'fallback' });
    }

    const data = await response.json();
    if (!Array.isArray(data.questions) || data.questions.length === 0) {
      return NextResponse.json({ ok: true, questions: buildFallbackQuestions(topics, count, difficulty), source: 'fallback' });
    }

    return NextResponse.json({ ok: true, questions: data.questions, source: 'backend' });
  } catch (err) {
    return NextResponse.json({
      ok: true,
      questions: buildFallbackQuestions(['Data Structures'], 5, 'Medium'),
      source: 'fallback',
      warning: err.message,
    });
  }
}

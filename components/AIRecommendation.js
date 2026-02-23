'use client'
import React, { useState } from 'react';

export default function AIRecommendation({ userStats = {} }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function fetchRecommendation() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/nextQuestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userStats }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Request failed');
      setResult(data.suggestion);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const rec = result?.recommended;
  const difficultyColor = {
    easy: 'text-green-600',
    medium: 'text-yellow-600',
    hard: 'text-red-600',
  };

  return (
    <div className="ai-recommendation p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
      <h3 className="text-lg font-semibold mb-3">Next Question Recommendation</h3>

      <button
        onClick={fetchRecommendation}
        disabled={loading}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? 'Thinking…' : 'Suggest Next Question'}
      </button>

      {error && (
        <div className="mt-3 p-3 bg-red-100 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      {result && (
        <div className="mt-4 space-y-2">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Source:</strong> {result.source || (result.fromAI ? 'AI' : 'Heuristics')}
          </div>

          {rec && (
            <div className="space-y-2">
              <div className="text-lg font-medium">{rec.title}</div>

              <div className="flex gap-4 text-sm">
                <span>
                  <strong>Difficulty:</strong>{' '}
                  <span className={difficultyColor[rec.difficulty] || ''}>
                    {rec.difficulty?.toUpperCase()}
                  </span>
                </span>
                {rec.topic && (
                  <span>
                    <strong>Topic:</strong> {rec.topic}
                  </span>
                )}
              </div>

              {rec.reason && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded text-sm">
                  {rec.reason}
                </div>
              )}

              {rec.nextMilestone && (
                <div className="text-xs text-gray-500">
                  Next milestone: {rec.nextMilestone} problems
                </div>
              )}
            </div>
          )}

          {result.text && !rec && (
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded whitespace-pre-wrap text-sm">
              {result.text}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

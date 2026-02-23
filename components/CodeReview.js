'use client'
import React, { useState } from 'react';

export default function CodeReview({ code, language }) {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    async function fetchReview() {
        if (!code || !code.trim()) {
            setError('No code to review');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/ai/codeReview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, language }),
            });
            const data = await res.json();
            if (!data.ok) throw new Error(data.error || 'Request failed');
            setResult(data.review);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="code-review-panel p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
            <h3 className="text-lg font-semibold mb-3">AI Code Review</h3>

            <button
                onClick={fetchReview}
                disabled={loading || !code}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
                {loading ? 'Analyzing...' : 'Review Code'}
            </button>

            {error && (
                <div className="mt-3 p-3 bg-red-100 text-red-700 rounded">
                    Error: {error}
                </div>
            )}

            {result && (
                <div className="mt-4 space-y-3">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>Source:</strong> {result.fromAI ? ' AI-Powered' : '📊 Static Analysis'}
                    </div>

                    {result.review && (
                        <div className="space-y-4">
                            {result.review.bugs && result.review.bugs.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-red-600">🐛 Potential Bugs:</h4>
                                    <ul className="list-disc ml-5 mt-1">
                                        {result.review.bugs.map((bug, i) => (
                                            <li key={i} className="text-sm">{bug}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {result.review.style && result.review.style.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-yellow-600">✨ Style Improvements:</h4>
                                    <ul className="list-disc ml-5 mt-1">
                                        {result.review.style.map((item, i) => (
                                            <li key={i} className="text-sm">{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {result.review.performance && result.review.performance.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-orange-600">⚡ Performance:</h4>
                                    <ul className="list-disc ml-5 mt-1">
                                        {result.review.performance.map((item, i) => (
                                            <li key={i} className="text-sm">{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {result.review.bestPractices && result.review.bestPractices.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-green-600">✅ Best Practices:</h4>
                                    <ul className="list-disc ml-5 mt-1">
                                        {result.review.bestPractices.map((item, i) => (
                                            <li key={i} className="text-sm">{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {result.review.summary && (
                                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900 rounded">
                                    <strong>Summary:</strong> {result.review.summary}
                                </div>
                            )}
                        </div>
                    )}

                    {result.text && !result.review && (
                        <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded whitespace-pre-wrap text-sm">
                            {result.text}
                        </div>
                    )}

                    {result.staticAnalysis && (
                        <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900 rounded text-sm">
                            <strong>Static Analysis:</strong>
                            <pre className="mt-1 text-xs overflow-auto">
                                {JSON.stringify(result.staticAnalysis, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

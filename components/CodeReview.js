'use client'
import React, { useState, useEffect, useRef } from 'react';
import { FiAlertOctagon, FiStar, FiZap, FiCheckCircle } from 'react-icons/fi';

function ReviewSection({ title, icon, color, items }) {
    if (!items || items.length === 0) return null;
    return (
        <div>
            <h4 className={`font-semibold ${color}`}>{icon} {title}:</h4>
            <ul className="list-disc ml-5 mt-1">
                {items.map((item, i) => (
                    <li key={i} className="text-sm">{item}</li>
                ))}
            </ul>
        </div>
    );
}

export default function CodeReview({ code, language, autoFetch }) {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const hasFetched = useRef(false);

    useEffect(() => {
        if (autoFetch && !result && !loading && !hasFetched.current && code?.trim()) {
            hasFetched.current = true;
            fetchReview();
        }
    }, [autoFetch]);

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

    const hasLLM = result?.llmReview && !result?.llmError;
    const reviewData = hasLLM ? result.llmReview : result?.review;

    return (
        <div className="code-review-panel">
            {!result && (
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold">AI Code Review</h3>
                    <button
                        onClick={fetchReview}
                        disabled={loading || !code}
                        className="px-4 py-2 bg-dark-4 dark:bg-dark-4 text-light-1 rounded-lg hover:bg-dark-1 dark:hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm transition-colors"
                    >
                        {loading ? 'Analyzing...' : 'Review Code'}
                    </button>
                </div>
            )}

            {loading && (
                <div className="text-sm text-gray-500 dark:text-gray-400">Analyzing your code...</div>
            )}

            {error && (
                <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded text-sm">
                    Error: {error}
                </div>
            )}

            {result && (
                <div className="space-y-3">
                    {reviewData && !reviewData.raw ? (
                        <div className="space-y-4">
                            <ReviewSection title="Potential Bugs" icon={<FiAlertOctagon className="inline" />} color="text-red-500 dark:text-red-400" items={reviewData.bugs} />
                            <ReviewSection title="Style Improvements" icon={<FiStar className="inline" />} color="text-yellow-500 dark:text-yellow-400" items={reviewData.style} />
                            <ReviewSection title="Performance" icon={<FiZap className="inline" />} color="text-orange-500 dark:text-orange-400" items={reviewData.performance} />
                            <ReviewSection title="Best Practices" icon={<FiCheckCircle className="inline" />} color="text-green-500 dark:text-green-400" items={reviewData.bestPractices} />
                            {reviewData.summary && (
                                <div className="mt-2 p-3 bg-light-3 dark:bg-dark-4 rounded text-sm">
                                    <strong>Summary:</strong> {reviewData.summary}
                                </div>
                            )}
                        </div>
                    ) : reviewData?.raw ? (
                        <div className="p-3 bg-light-3 dark:bg-dark-4 rounded whitespace-pre-wrap text-sm">
                            {reviewData.raw}
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
}

'use client'
import React, { useState, useEffect, useRef } from 'react';
import { FiTarget } from 'react-icons/fi';

function ComplexityCard({ label, value }) {
    return (
        <div className="p-3 bg-light-3 dark:bg-dark-4 rounded">
            <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
            <div className="text-2xl font-bold">{value}</div>
        </div>
    );
}

export default function ComplexityAnalysis({ code, language, autoFetch }) {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const hasFetched = useRef(false);

    useEffect(() => {
        if (autoFetch && !result && !loading && !hasFetched.current && code?.trim()) {
            hasFetched.current = true;
            fetchAnalysis();
        }
    }, [autoFetch]);

    async function fetchAnalysis() {
        if (!code || !code.trim()) {
            setError('No code to analyze');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/ai/complexity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, language }),
            });
            const data = await res.json();
            if (!data.ok) throw new Error(data.error || 'Request failed');
            setResult(data.analysis);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    // Use LLM analysis if available, otherwise fallback to heuristic
    const analysis = result?.llmAnalysis || result?.complexity;

    return (
        <div className="complexity-analysis-panel">
            {!result && (
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold">Complexity Analysis</h3>
                    <button
                        onClick={fetchAnalysis}
                        disabled={loading || !code}
                        className="px-4 py-2 bg-dark-4 dark:bg-dark-4 text-light-1 rounded-lg hover:bg-dark-1 dark:hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm transition-colors"
                    >
                        {loading ? 'Analyzing...' : 'Analyze Complexity'}
                    </button>
                </div>
            )}

            {loading && (
                <div className="text-sm text-gray-500 dark:text-gray-400">Analyzing complexity...</div>
            )}

            {error && (
                <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded text-sm">
                    Error: {error}
                </div>
            )}

            {result && analysis && (
                <div className="space-y-3">
                    {analysis.raw ? (
                        <div className="p-3 bg-light-3 dark:bg-dark-4 rounded whitespace-pre-wrap text-sm">
                            {analysis.raw}
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                {analysis.timeComplexity && (
                                    <ComplexityCard label="Time Complexity" value={analysis.timeComplexity} />
                                )}
                                {analysis.spaceComplexity && (
                                    <ComplexityCard label="Space Complexity" value={analysis.spaceComplexity} />
                                )}
                            </div>
                            {analysis.explanation && (
                                <div className="p-3 bg-light-3 dark:bg-dark-4 rounded">
                                    <strong>Explanation:</strong>
                                    <p className="mt-1 text-sm">{analysis.explanation}</p>
                                </div>
                            )}
                            {analysis.optimizationSuggestions && analysis.optimizationSuggestions.length > 0 && (
                                <div>
                                    <h4 className="font-semibold flex items-center gap-1.5"><FiTarget className="inline" /> Optimization Suggestions:</h4>
                                    <ul className="list-disc ml-5 mt-1">
                                        {analysis.optimizationSuggestions.map((s, i) => (
                                            <li key={i} className="text-sm">{s}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

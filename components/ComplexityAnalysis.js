'use client'
import React, { useState } from 'react';

export default function ComplexityAnalysis({ code, language }) {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

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

    return (
        <div className="complexity-analysis-panel p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
            <h3 className="text-lg font-semibold mb-3">Complexity Analysis</h3>

            <button
                onClick={fetchAnalysis}
                disabled={loading || !code}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
                {loading ? 'Analyzing...' : 'Analyze Complexity'}
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

                    {result.complexity && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded">
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Time Complexity</div>
                                    <div className="text-2xl font-bold">{result.complexity.timeComplexity}</div>
                                </div>
                                <div className="p-3 bg-green-100 dark:bg-green-900 rounded">
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Space Complexity</div>
                                    <div className="text-2xl font-bold">{result.complexity.spaceComplexity}</div>
                                </div>
                            </div>

                            {result.complexity.explanation && (
                                <div className="p-3 bg-yellow-50 dark:bg-yellow-900 rounded">
                                    <strong>Explanation:</strong>
                                    <p className="mt-1 text-sm">{result.complexity.explanation}</p>
                                </div>
                            )}

                            {result.complexity.optimizationSuggestions && result.complexity.optimizationSuggestions.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-purple-600">💡 Optimization Suggestions:</h4>
                                    <ul className="list-disc ml-5 mt-1">
                                        {result.complexity.optimizationSuggestions.map((suggestion, i) => (
                                            <li key={i} className="text-sm">{suggestion}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {result.text && !result.complexity && (
                        <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded whitespace-pre-wrap text-sm">
                            {result.text}
                        </div>
                    )}

                    {result.staticAnalysis && (
                        <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900 rounded">
                            <strong>Static Analysis (Python):</strong>
                            {result.staticAnalysis.cyclomaticComplexity && (
                                <div className="mt-2">
                                    <div className="text-sm font-semibold">Cyclomatic Complexity:</div>
                                    <div className="mt-1 space-y-1">
                                        {result.staticAnalysis.cyclomaticComplexity.map((item, i) => (
                                            <div key={i} className="text-xs flex justify-between">
                                                <span>{item.name}</span>
                                                <span className="font-mono">
                                                    {item.complexity} (Rank: {item.rank})
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {result.staticAnalysis.functions && (
                                <div className="mt-2 text-xs">
                                    <pre className="overflow-auto">
                                        {JSON.stringify(result.staticAnalysis.functions, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

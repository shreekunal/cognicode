'use client'
import React, { useState } from 'react';
import Link from 'next/link';
import { FiList, FiTarget, FiZap, FiAlertCircle, FiTrendingUp, FiChevronDown, FiRefreshCw } from 'react-icons/fi';

export default function AIRecommendation({ currentDifficulty }) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [insights, setInsights] = useState(null);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  async function fetchRecommendation() {
    setLoading(true);
    setError(null);
    try {
      const statsRes = await fetch('/api/getUserStats');
      const statsData = await statsRes.json();

      const userStats = statsData.ok ? {
        ...statsData.stats,
        lastDifficulty: currentDifficulty || statsData.stats?.recentDifficulty || 'Easy'
      } : {
        accuracy: 0,
        problemsSolved: 0,
        solvedProblemIds: [],
        solvedCategories: {},
        lastDifficulty: currentDifficulty || 'Easy'
      };

      const res = await fetch('/api/ai/nextQuestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userStats }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Request failed');
      setResults(data.suggestion?.recommendations || []);
      setInsights(data.suggestion?.insights || null);
      setExpanded(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const difficultyColor = {
    Easy: 'bg-green-100 text-green-800 border-green-300',
    Medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    Hard: 'bg-red-100 text-red-800 border-red-300',
  };

  const typeConfig = {
    serial: { icon: FiList, label: 'Next in Sequence', accent: 'text-blue-600 dark:text-blue-400', border: 'border-l-blue-500' },
    accuracy: { icon: FiTarget, label: 'Accuracy Based', accent: 'text-indigo-600 dark:text-indigo-400', border: 'border-l-indigo-500' },
    challenge: { icon: FiZap, label: 'Challenge Mode', accent: 'text-amber-600 dark:text-amber-400', border: 'border-l-amber-500' },
  };

  const hasResults = results.length > 0;

  const renderCard = (rec, index, fullWidth = false) => {
    const config = typeConfig[rec.type] || typeConfig.serial;
    const IconComponent = config.icon;
    return (
      <Link
        key={index}
        href={`/problems/${rec.problemId}`}
        className={`block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 border-l-4 ${config.border} p-3 hover:shadow-lg transition-all hover:border-blue-400 dark:hover:border-blue-500 group cursor-pointer ${fullWidth ? 'flex gap-6' : ''}`}
      >
        <div className={fullWidth ? 'flex-1' : ''}>
          <div className="flex items-start justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <IconComponent className={`w-4 h-4 ${config.accent}`} />
              <span className={`text-xs font-semibold ${config.accent}`}>{config.label}</span>
            </div>
            <span className={`px-2 py-0.5 text-xs font-bold rounded border ${difficultyColor[rec.difficulty] || difficultyColor.Medium}`}>
              {rec.difficulty}
            </span>
          </div>

          <h4 className="text-sm font-bold text-gray-800 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {rec.title}
          </h4>

          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
            {rec.topic && <span>{rec.topic}</span>}
            {rec.order > 0 && <span>#{rec.order}</span>}
            {rec.likes > 0 && <span>{rec.likes} likes</span>}
          </div>

          {rec.companies?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {rec.companies.map((company, i) => (
                <span key={i} className="px-1.5 py-0.5 text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded">
                  {company}
                </span>
              ))}
            </div>
          )}

          {rec.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 max-h-0 overflow-hidden opacity-0 group-hover:max-h-96 group-hover:opacity-100 group-hover:mt-1.5 transition-all duration-300">
              {rec.description}
            </p>
          )}
        </div>
      </Link>
    );
  };

  return (
    <div className="ai-recommendation rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
      {/* Header bar — always visible */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-850 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => hasResults && setExpanded(!expanded)}
          className={`flex items-center gap-2 ${hasResults ? 'cursor-pointer' : 'cursor-default'}`}
        >
          <FiTrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-semibold text-gray-800 dark:text-white">AI-Powered Recommendation</span>

          {/* Insight chips inline */}
          {insights && (
            <div className="hidden sm:flex items-center gap-2 ml-3">
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium">
                {insights.recentAccuracy ?? insights.accuracy}% acc
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium">
                {insights.problemsSolved} solved
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium">
                Target: {insights.targetDifficulty}
              </span>
              {insights.weakCategory && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium">
                  Weak: {insights.weakCategory}
                </span>
              )}
              {insights.stuckCategories?.length > 0 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-medium">
                  Stuck: {insights.stuckCategories.join(', ')}
                </span>
              )}
            </div>
          )}

          {hasResults && (
            <FiChevronDown className={`w-4 h-4 text-gray-400 ml-1 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
          )}
        </button>

        <div className="flex items-center gap-2">
          {hasResults && (
            <button
              onClick={fetchRecommendation}
              disabled={loading}
              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition rounded-md hover:bg-blue-50 dark:hover:bg-gray-700 disabled:opacity-40"
              title="Refresh recommendations"
            >
              <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
          {!hasResults && (
            <button
              onClick={fetchRecommendation}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-1.5">
                  <FiRefreshCw className="w-3 h-3 animate-spin" />
                  Analyzing...
                </span>
              ) : 'Get Recommendations'}
            </button>
          )}
        </div>
      </div>

      {/* Collapsible content */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          expanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-3">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm mb-3">
              <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {hasResults && (() => {
            const topTwo = results.filter(r => r.type !== 'challenge');
            const challenge = results.find(r => r.type === 'challenge');
            return (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {topTwo.map((rec, i) => renderCard(rec, i))}
                </div>
                {challenge && renderCard(challenge, 'challenge', true)}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

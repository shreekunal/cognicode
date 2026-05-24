'use client'
import React, { useState } from 'react';
import Link from 'next/link';
import { FiList, FiTarget, FiZap, FiAlertCircle, FiChevronDown, FiRefreshCw } from 'react-icons/fi';
import { BsStars } from 'react-icons/bs';
import { slugify } from '@/utils/slugify';

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
    serial: { icon: FiList, label: 'Next in Sequence', accent: 'text-blue-600 dark:text-blue-400' },
    accuracy: { icon: FiTarget, label: 'Accuracy Based', accent: 'text-indigo-600 dark:text-indigo-400' },
    challenge: { icon: FiZap, label: 'Challenge Mode', accent: 'text-amber-600 dark:text-amber-400' },
  };

  const hasResults = results.length > 0;

  const renderCard = (rec, index, fullWidth = false) => {
    const config = typeConfig[rec.type] || typeConfig.serial;
    const IconComponent = config.icon;
    return (
      <Link
        key={index}
        href={`/problems/${rec.problemId}/${slugify(rec.title)}`}
        className={`block bg-light-1 dark:bg-dark-3 rounded-lg border border-light-4 dark:border-dark-4 p-3 hover:shadow-lg transition-all hover:border-gray-400 dark:hover:border-gray-500 group cursor-pointer ${fullWidth ? 'flex gap-6' : ''}`}
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

          <h4 className="text-sm font-bold text-gray-800 dark:text-white mb-1 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
            {rec.title}
          </h4>

          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
            {rec.topic && <span>{rec.topic}</span>}
            {rec.order > 0 && <span>#{rec.order}</span>}
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
    <div className="ai-recommendation rounded-lg border border-light-4 dark:border-dark-4 bg-light-1 dark:bg-dark-2 overflow-hidden">
      {/* Header bar — always visible */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-light-3 dark:bg-dark-4 border-b border-light-4 dark:border-dark-4">
        <button
          onClick={() => hasResults && setExpanded(!expanded)}
          className={`flex items-center gap-2 ${hasResults ? 'cursor-pointer' : 'cursor-default'}`}
        >
          <BsStars className="w-4 h-4 text-red-500" />
          <span className="text-sm font-semibold text-red-600 dark:text-red-400">AI-Powered Recommendation</span>

          {/* Insight chips inline */}
          {insights && (
            <div className="hidden sm:flex items-center gap-2 ml-3">
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium">
                {insights.recentAccuracy ?? insights.accuracy}% acc
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium">
                {insights.problemsSolved} solved
              </span>
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
              className="p-1.5 text-gray-400 hover:text-dark-4 dark:hover:text-light-1 transition rounded-md hover:bg-light-4 dark:hover:bg-dark-3 disabled:opacity-40"
              title="Refresh recommendations"
            >
              <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
          {!hasResults && (
            <button
              onClick={fetchRecommendation}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-medium bg-red-600 hover:bg-red-700 text-white rounded-md transition disabled:bg-gray-400 disabled:cursor-not-allowed"
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
        className={`transition-all duration-300 ease-in-out overflow-hidden ${expanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
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

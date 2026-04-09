'use client';

import { useEffect, useMemo, useState } from 'react';
import { FiPlay, FiSend, FiChevronRight, FiClock, FiTarget, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import CodeEditorWindow from './shared/CodeEditorWindow';
import LanguagesDropdown from './shared/LanguagesDropdown';
import ThemeDropdown from './shared/ThemeDropdown';
import FontSizeDropdown from './shared/FontSizeDropdown';
import { getStarterForLanguage, languagesData, mockComments } from '@/constants';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

function normalizeDifficulty(raw) {
    if (!raw) return 'Easy';
    const value = String(raw).toLowerCase();
    if (value.includes('hard')) return 'Hard';
    if (value.includes('medium')) return 'Medium';
    return 'Easy';
}

function stripHtml(html) {
    return String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function getHintText(data) {
    return data?.hint || data?.suggestion || data?.response || data?.message || 'Try breaking the problem into smaller steps and reason about edge cases first.';
}

function adjustDifficulty(currentDifficulty, accepted) {
    const idx = DIFFICULTIES.indexOf(currentDifficulty);
    if (idx < 0) return 'Easy';
    if (accepted) return DIFFICULTIES[Math.min(idx + 1, DIFFICULTIES.length - 1)];
    return DIFFICULTIES[Math.max(idx - 1, 0)];
}

function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
}

export default function AdaptiveInterviewMode() {
    const [problems, setProblems] = useState([]);
    const [loadingProblems, setLoadingProblems] = useState(true);
    const [loadingError, setLoadingError] = useState('');

    const [phase, setPhase] = useState('setup');
    const [totalRounds, setTotalRounds] = useState(3);
    const [strictHints, setStrictHints] = useState(true);
    const [startDifficulty, setStartDifficulty] = useState('Easy');

    const [roundIndex, setRoundIndex] = useState(0);
    const [currentDifficulty, setCurrentDifficulty] = useState('Easy');
    const [currentProblem, setCurrentProblem] = useState(null);
    const [usedProblemIds, setUsedProblemIds] = useState([]);

    const [language, setLanguage] = useState(languagesData[3]);
    const [theme, setTheme] = useState({ value: 'dark', label: 'Dark' });
    const [fontSize, setFontSize] = useState({ value: '14px', label: '14' });
    const [code, setCode] = useState(mockComments[languagesData[3].value]);
    const [customInput, setCustomInput] = useState('');

    const [runOutput, setRunOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [hint, setHint] = useState('');
    const [hintCount, setHintCount] = useState(0);

    const [roundStartedAt, setRoundStartedAt] = useState(0);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    const [roundResults, setRoundResults] = useState([]);
    const [scorecard, setScorecard] = useState(null);
    const [buildingScorecard, setBuildingScorecard] = useState(false);

    useEffect(() => {
        let timer;
        if (phase === 'live' && roundStartedAt) {
            timer = setInterval(() => {
                setElapsedSeconds(Math.floor((Date.now() - roundStartedAt) / 1000));
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [phase, roundStartedAt]);

    useEffect(() => {
        const loadProblems = async () => {
            try {
                setLoadingProblems(true);
                const res = await fetch('/api/getAllProblems');
                const data = await res.json();
                if (!res.ok || !Array.isArray(data)) {
                    throw new Error('Unable to load problems for interview mode.');
                }
                setProblems(data);
            } catch (err) {
                setLoadingError(err.message);
            } finally {
                setLoadingProblems(false);
            }
        };

        loadProblems();
    }, []);

    const progressPct = useMemo(() => {
        if (!totalRounds) return 0;
        return Math.round((roundIndex / totalRounds) * 100);
    }, [roundIndex, totalRounds]);

    const pickProblem = (targetDifficulty, excludedIds) => {
        const normalized = normalizeDifficulty(targetDifficulty);
        const byDifficulty = problems.filter(
            (p) => normalizeDifficulty(p.difficulty) === normalized && !excludedIds.includes(p.id)
        );

        if (byDifficulty.length > 0) {
            return byDifficulty[Math.floor(Math.random() * byDifficulty.length)];
        }

        const fallback = problems.filter((p) => !excludedIds.includes(p.id));
        if (fallback.length === 0) return null;
        return fallback[Math.floor(Math.random() * fallback.length)];
    };

    const startRound = (newRoundIndex, difficulty, excludedIds, preferredLanguage = language) => {
        const picked = pickProblem(difficulty, excludedIds);
        if (!picked) {
            setPhase('scorecard');
            return;
        }

        const starter = picked.starterCode
            ? getStarterForLanguage(picked.starterCode, preferredLanguage.value)
            : mockComments[preferredLanguage.value];

        const firstInput = picked.testCases?.[0]?.input;
        const preparedInput = Array.isArray(firstInput) ? firstInput.join('\n') : (firstInput || '');

        setRoundIndex(newRoundIndex);
        setCurrentDifficulty(normalizeDifficulty(picked.difficulty) || difficulty);
        setCurrentProblem(picked);
        setUsedProblemIds([...excludedIds, picked.id]);
        setCode(starter);
        setCustomInput(preparedInput);
        setRunOutput('');
        setHint('');
        setHintCount(0);
        setElapsedSeconds(0);
        setRoundStartedAt(Date.now());
    };

    const startInterview = () => {
        setRoundResults([]);
        setScorecard(null);
        setPhase('live');
        setCurrentDifficulty(startDifficulty);
        startRound(1, startDifficulty, []);
    };

    const runCode = async () => {
        if (!code) return;
        setIsRunning(true);
        setRunOutput('Running...');
        try {
            const res = await fetch('/api/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    language: language.value,
                    code,
                    input: customInput,
                }),
            });
            const data = await res.json();
            setRunOutput(data.output || data.error || 'No output returned.');
        } catch (err) {
            setRunOutput(`Execution error: ${err.message}`);
        } finally {
            setIsRunning(false);
        }
    };

    const requestHint = async () => {
        if (!currentProblem || !code) return;
        if (strictHints && hintCount >= 1) {
            setHint('Strict mode allows only one hint per round.');
            return;
        }

        try {
            setHint('Generating hint...');
            const res = await fetch('/api/ai/hint', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    problemTitle: currentProblem.title,
                    problemStatement: stripHtml(currentProblem.problemStatement),
                    code,
                    language: language.value,
                }),
            });
            const data = await res.json();
            if (!res.ok || !data.ok) {
                throw new Error(data.error || 'Failed to fetch hint.');
            }
            setHint(getHintText(data));
            setHintCount((prev) => prev + 1);
        } catch (err) {
            setHint(`Hint unavailable: ${err.message}`);
        }
    };

    const buildFallbackScorecard = (results) => {
        const total = results.length || 1;
        const acceptedCount = results.filter((r) => r.accepted).length;
        const accuracy = Math.round((acceptedCount / total) * 100);
        const avgTime = Math.round(results.reduce((sum, r) => sum + r.timeTakenSec, 0) / total);
        const codeQuality = Math.max(40, Math.min(95, Math.round(accuracy * 0.6 + (100 - Math.min(avgTime, 1800) / 18) * 0.4)));
        const timeManagement = Math.max(30, Math.min(95, 100 - Math.round(avgTime / 20)));
        const communication = 70;
        const overall = Math.round((accuracy + codeQuality + timeManagement + communication) / 4);

        return {
            summary: 'Scorecard generated from your round outcomes. Enable Python AI backend for richer narrative feedback.',
            overall,
            metrics: {
                problemSolving: accuracy,
                codeQuality,
                communication,
                timeManagement,
            },
            strengths: accuracy >= 67 ? ['Solid correctness under pressure', 'Consistent completion across rounds'] : ['Stayed engaged across all rounds'],
            improvements: accuracy < 67
                ? ['Focus on brute-force first, then optimize', 'Practice identifying edge cases before coding']
                : ['Explain your approach aloud before coding', 'Aim for cleaner variable naming under time pressure'],
            nextWeekPlan: [
                'Day 1-2: 2 easy timed problems with strict no-hint policy.',
                'Day 3-4: 2 medium problems and post-solution self-review.',
                'Day 5-6: 1 hard + 1 medium mixed round.',
                'Day 7: Full mock interview round and compare score changes.',
            ],
            followUps: [
                'What is the tradeoff between readability and micro-optimizations in your latest solution?',
                'How would you test your solution for edge cases in under 2 minutes?',
            ],
        };
    };

    const buildScorecard = async (results) => {
        setBuildingScorecard(true);
        try {
            const res = await fetch('/api/ai/interview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ results }),
            });
            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data.error || 'Could not generate AI scorecard.');
            setScorecard(data.scorecard);
        } catch (err) {
            setScorecard(buildFallbackScorecard(results));
        } finally {
            setBuildingScorecard(false);
        }
    };

    const submitRound = async () => {
        if (!currentProblem || !code) return;

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/submitCode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code,
                    problem: currentProblem.id,
                    language: language.value,
                }),
            });

            const data = await res.json();
            const accepted = data.isAccepted === 'accepted';
            const result = {
                round: roundIndex,
                problemId: currentProblem.id,
                title: currentProblem.title,
                difficulty: normalizeDifficulty(currentProblem.difficulty),
                accepted,
                passedTestCases: data.passedTestCases || 0,
                totalTestCases: data.totalTestCases || 0,
                timeTakenSec: Math.floor((Date.now() - roundStartedAt) / 1000),
                hintCount,
                language: language.value,
            };

            const nextResults = [...roundResults, result];
            setRoundResults(nextResults);

            if (roundIndex >= totalRounds) {
                setPhase('scorecard');
                buildScorecard(nextResults);
                return;
            }

            const nextDifficulty = adjustDifficulty(currentDifficulty, accepted);
            startRound(roundIndex + 1, nextDifficulty, [...usedProblemIds]);
        } catch (err) {
            setRunOutput(`Submission failed: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLanguageChange = (lang) => {
        setLanguage(lang);
        if (!currentProblem) {
            setCode(mockComments[lang.value]);
            return;
        }
        const starter = currentProblem.starterCode
            ? getStarterForLanguage(currentProblem.starterCode, lang.value)
            : mockComments[lang.value];
        setCode(starter);
    };

    if (loadingProblems) {
        return <div className="rounded-xl border border-light-4 dark:border-dark-4 p-6 text-sm text-gray-500 dark:text-gray-300">Loading interview problem bank...</div>;
    }

    if (loadingError) {
        return <div className="rounded-xl border border-red-300 bg-red-50 text-red-700 p-6 text-sm">{loadingError}</div>;
    }

    return (
        <div className="w-full space-y-4">
            <div className="rounded-xl border border-light-4 dark:border-dark-4 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                        <h2 className="text-xl font-bold dark:text-light-1">Adaptive Interview Mode</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Practice real interview pressure with adaptive difficulty and AI scorecards.</p>
                    </div>
                    {phase === 'live' && (
                        <div className="px-3 py-2 rounded-lg bg-light-3 dark:bg-dark-4 text-sm flex items-center gap-2">
                            <FiClock />
                            Round time: {formatDuration(elapsedSeconds)}
                        </div>
                    )}
                </div>

                {phase === 'setup' && (
                    <div className="mt-4 grid sm:grid-cols-3 gap-3">
                        <label className="text-sm">
                            <span className="block mb-1 text-gray-600 dark:text-gray-300">Rounds</span>
                            <select
                                className="w-full rounded-lg border border-light-4 dark:border-dark-4 bg-transparent p-2"
                                value={totalRounds}
                                onChange={(e) => setTotalRounds(Number(e.target.value))}
                            >
                                {[2, 3, 4, 5].map((value) => <option key={value} value={value}>{value} rounds</option>)}
                            </select>
                        </label>

                        <label className="text-sm">
                            <span className="block mb-1 text-gray-600 dark:text-gray-300">Start difficulty</span>
                            <select
                                className="w-full rounded-lg border border-light-4 dark:border-dark-4 bg-transparent p-2"
                                value={startDifficulty}
                                onChange={(e) => setStartDifficulty(e.target.value)}
                            >
                                {DIFFICULTIES.map((value) => <option key={value} value={value}>{value}</option>)}
                            </select>
                        </label>

                        <label className="text-sm flex items-center gap-2 mt-6">
                            <input
                                type="checkbox"
                                checked={strictHints}
                                onChange={(e) => setStrictHints(e.target.checked)}
                            />
                            Strict mode (1 hint per round)
                        </label>

                        <div className="sm:col-span-3 flex justify-end">
                            <button
                                onClick={startInterview}
                                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm flex items-center gap-2"
                            >
                                <FiPlay /> Start Interview
                            </button>
                        </div>
                    </div>
                )}

                {phase === 'live' && currentProblem && (
                    <div className="mt-4 space-y-4">
                        <div className="w-full h-2 rounded-full bg-light-3 dark:bg-dark-4 overflow-hidden">
                            <div className="h-full bg-red-500" style={{ width: `${progressPct}%` }} />
                        </div>

                        <div className="grid lg:grid-cols-3 gap-4">
                            <div className="lg:col-span-2 rounded-xl border border-light-4 dark:border-dark-4 p-4">
                                <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                                    <h3 className="font-semibold text-base dark:text-light-1">Round {roundIndex}/{totalRounds}: {currentProblem.title}</h3>
                                    <div className="px-2 py-1 rounded-full text-xs bg-light-3 dark:bg-dark-4">{normalizeDifficulty(currentProblem.difficulty)}</div>
                                </div>
                                <div className="text-sm leading-6 text-gray-700 dark:text-gray-300 max-h-[240px] overflow-y-auto pr-2" dangerouslySetInnerHTML={{ __html: currentProblem.problemStatement || '' }} />
                            </div>

                            <div className="rounded-xl border border-light-4 dark:border-dark-4 p-4 space-y-3">
                                <h4 className="font-semibold text-sm dark:text-light-1">Round Controls</h4>
                                <div className="flex gap-2 flex-wrap">
                                    <LanguagesDropdown onSelectChange={handleLanguageChange} value={language} />
                                    <ThemeDropdown handleThemeChange={setTheme} />
                                    <FontSizeDropdown onSelectChange={setFontSize} />
                                </div>
                                <button
                                    onClick={requestHint}
                                    className="w-full px-3 py-2 rounded-lg border border-light-4 dark:border-dark-4 text-sm hover:bg-light-3 dark:hover:bg-dark-4"
                                >
                                    Get Hint ({hintCount}{strictHints ? '/1' : ''})
                                </button>
                                {hint && <p className="text-xs text-gray-600 dark:text-gray-300 bg-light-3 dark:bg-dark-4 p-2 rounded-lg">{hint}</p>}
                            </div>
                        </div>

                        <div className="rounded-xl border border-light-4 dark:border-dark-4 p-4 space-y-3">
                            <CodeEditorWindow
                                code={code}
                                onChange={setCode}
                                language={language.value}
                                theme={theme.value}
                                fontSize={fontSize.value}
                                forProblemsPage={false}
                                isInterview
                            />

                            <label className="block text-sm">
                                <span className="block mb-1 text-gray-600 dark:text-gray-300">Custom Input</span>
                                <textarea
                                    value={customInput}
                                    onChange={(e) => setCustomInput(e.target.value)}
                                    rows={4}
                                    className="w-full rounded-lg border border-light-4 dark:border-dark-4 bg-transparent p-2"
                                    placeholder="Enter test input"
                                />
                            </label>

                            <div className="flex items-center gap-2 flex-wrap justify-end">
                                <button
                                    onClick={runCode}
                                    disabled={isRunning}
                                    className="px-4 py-2 rounded-lg border border-light-4 dark:border-dark-4 text-sm hover:bg-light-3 dark:hover:bg-dark-4"
                                >
                                    <span className="inline-flex items-center gap-2"><FiPlay />{isRunning ? 'Running...' : 'Run'}</span>
                                </button>
                                <button
                                    onClick={submitRound}
                                    disabled={isSubmitting}
                                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm"
                                >
                                    <span className="inline-flex items-center gap-2"><FiSend />{isSubmitting ? 'Submitting...' : 'Submit Round'}</span>
                                </button>
                            </div>

                            <div className="rounded-lg bg-light-3 dark:bg-dark-4 p-3 text-sm whitespace-pre-wrap min-h-[80px]">
                                {runOutput || 'Execution output will appear here.'}
                            </div>
                        </div>
                    </div>
                )}

                {phase === 'scorecard' && (
                    <div className="mt-5 space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <h3 className="text-lg font-bold dark:text-light-1">Interview Scorecard</h3>
                            <button
                                onClick={() => setPhase('setup')}
                                className="px-3 py-2 rounded-lg border border-light-4 dark:border-dark-4 text-sm hover:bg-light-3 dark:hover:bg-dark-4"
                            >
                                Start New Round
                            </button>
                        </div>

                        {buildingScorecard && (
                            <div className="text-sm text-gray-500 dark:text-gray-300">Generating AI scorecard...</div>
                        )}

                        {!buildingScorecard && scorecard && (
                            <div className="space-y-4">
                                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                    <div className="rounded-lg border border-light-4 dark:border-dark-4 p-3">
                                        <p className="text-xs text-gray-500">Overall</p>
                                        <p className="text-2xl font-bold text-red-600">{scorecard.overall}/100</p>
                                    </div>
                                    <div className="rounded-lg border border-light-4 dark:border-dark-4 p-3">
                                        <p className="text-xs text-gray-500">Problem Solving</p>
                                        <p className="text-xl font-semibold">{scorecard.metrics?.problemSolving ?? '-'}%</p>
                                    </div>
                                    <div className="rounded-lg border border-light-4 dark:border-dark-4 p-3">
                                        <p className="text-xs text-gray-500">Code Quality</p>
                                        <p className="text-xl font-semibold">{scorecard.metrics?.codeQuality ?? '-'}%</p>
                                    </div>
                                    <div className="rounded-lg border border-light-4 dark:border-dark-4 p-3">
                                        <p className="text-xs text-gray-500">Time Management</p>
                                        <p className="text-xl font-semibold">{scorecard.metrics?.timeManagement ?? '-'}%</p>
                                    </div>
                                </div>

                                <p className="text-sm text-gray-600 dark:text-gray-300">{scorecard.summary}</p>

                                <div className="grid lg:grid-cols-2 gap-3">
                                    <div className="rounded-lg border border-light-4 dark:border-dark-4 p-3">
                                        <h4 className="font-semibold text-sm mb-2 inline-flex items-center gap-2"><FiCheckCircle className="text-green-600" /> Strengths</h4>
                                        <ul className="text-sm list-disc pl-5 space-y-1">
                                            {(scorecard.strengths || []).map((item, idx) => <li key={idx}>{item}</li>)}
                                        </ul>
                                    </div>
                                    <div className="rounded-lg border border-light-4 dark:border-dark-4 p-3">
                                        <h4 className="font-semibold text-sm mb-2 inline-flex items-center gap-2"><FiAlertCircle className="text-yellow-600" /> Improvements</h4>
                                        <ul className="text-sm list-disc pl-5 space-y-1">
                                            {(scorecard.improvements || []).map((item, idx) => <li key={idx}>{item}</li>)}
                                        </ul>
                                    </div>
                                </div>

                                <div className="rounded-lg border border-light-4 dark:border-dark-4 p-3">
                                    <h4 className="font-semibold text-sm mb-2 inline-flex items-center gap-2"><FiTarget /> 7-Day Plan</h4>
                                    <ul className="text-sm list-disc pl-5 space-y-1">
                                        {(scorecard.nextWeekPlan || []).map((item, idx) => <li key={idx}>{item}</li>)}
                                    </ul>
                                </div>

                                <div className="rounded-lg border border-light-4 dark:border-dark-4 p-3">
                                    <h4 className="font-semibold text-sm mb-2 inline-flex items-center gap-2"><FiChevronRight /> Follow-up Interview Questions</h4>
                                    <ul className="text-sm list-disc pl-5 space-y-1">
                                        {(scorecard.followUps || []).map((item, idx) => <li key={idx}>{item}</li>)}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {!buildingScorecard && !scorecard && (
                            <div className="text-sm text-gray-500 dark:text-gray-300">Scorecard unavailable. Try another interview round.</div>
                        )}

                        <div className="rounded-lg border border-light-4 dark:border-dark-4 p-3">
                            <h4 className="font-semibold text-sm mb-2">Round Results</h4>
                            <div className="space-y-2">
                                {roundResults.map((r) => (
                                    <div key={`${r.round}-${r.problemId}`} className="text-sm flex items-center justify-between rounded-md bg-light-3 dark:bg-dark-4 p-2">
                                        <span>R{r.round} - {r.title} ({r.difficulty})</span>
                                        <span>{r.accepted ? 'Accepted' : 'Rejected'} | {r.passedTestCases}/{r.totalTestCases} | {formatDuration(r.timeTakenSec)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

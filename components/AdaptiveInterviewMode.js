'use client';

import { useEffect, useMemo, useState } from 'react';
import { FiPlay, FiSend, FiChevronRight, FiClock, FiTarget, FiCheckCircle, FiAlertCircle, FiBookOpen, FiZap, FiAlertTriangle } from 'react-icons/fi';
import { BsLightbulb } from 'react-icons/bs';
import CodeEditorWindow from './shared/CodeEditorWindow';
import LanguagesDropdown from './shared/LanguagesDropdown';
import ThemeDropdown from './shared/ThemeDropdown';
import FontSizeDropdown from './shared/FontSizeDropdown';
import { getStarterForLanguage, languagesData, mockComments } from '@/constants';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

const INTERVIEW_MODES = [
    { id: 'learning', label: 'Learning', description: 'Unlimited hints, ideal for practice.', hintLimit: Infinity, icon: <FiBookOpen /> },
    { id: 'standard', label: 'Standard', description: 'Balanced experience, up to 3 hints.', hintLimit: 3, icon: <FiTarget /> },
    { id: 'strict', label: 'Strict', description: 'High pressure, only 1 hint allowed.', hintLimit: 1, icon: <FiAlertTriangle /> },
    { id: 'expert', label: 'Expert', description: 'Real simulation, no hints allowed.', hintLimit: 0, icon: <FiZap /> },
];

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
    const [interviewType, setInterviewType] = useState('coding'); // 'coding' | 'mcq'
    const [totalRounds, setTotalRounds] = useState(3);
    const [selectedMode, setSelectedMode] = useState('standard');
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
    const [showAbortModal, setShowAbortModal] = useState(false);

    // MCQ State
    const [selectedTopics, setSelectedTopics] = useState([]);
    const [mcqQuestions, setMcqQuestions] = useState([]);
    const [currentMcqIndex, setMcqIndex] = useState(0);
    const [mcqAnswers, setMcqAnswers] = useState({}); // { index: 'A' }
    const [mcqLoading, setMcqLoading] = useState(false);

    const availableTopics = [
        'Data Structures', 'Algorithms', 'Operating Systems', 'DBMS',
        'Computer Networks', 'System Design', 'React.js', 'Node.js',
        'Python', 'Java', 'C++', 'Object Oriented Programming',
        'JavaScript', 'HTML & CSS', 'AWS', 'Docker & Kubernetes',
        'SQL & NoSQL', 'Cybersecurity', 'Machine Learning', 'Git & Version Control',
        'Software Testing', 'Agile Methodologies', 'TypeScript', 'Go', 'Rust'
    ];

    const toggleTopic = (topic) => {
        setSelectedTopics(prev =>
            prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
        );
    };

    useEffect(() => {
        let timer;
        if ((phase === 'live' || phase === 'live-mcq') && roundStartedAt) {
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

    const startInterview = async () => {
        setScorecard(null);
        setRoundResults([]);

        if (interviewType === 'mcq') {
            if (selectedTopics.length === 0) {
                alert('Please select at least one topic for the MCQ interview.');
                return;
            }
            startMcqInterview();
            return;
        }

        setPhase('live');
        setCurrentDifficulty(startDifficulty);
        startRound(1, startDifficulty, []);
    };

    const startMcqInterview = async () => {
        setMcqLoading(true);
        setPhase('live-mcq');
        try {
            const res = await fetch('/api/ai/mcq', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topics: selectedTopics,
                    count: totalRounds,
                    difficulty: startDifficulty
                }),
            });
            const data = await res.json();
            if (data.ok) {
                setMcqQuestions(data.questions);
                setMcqIndex(0);
                setMcqAnswers({});
                setRoundStartedAt(Date.now());
                setElapsedSeconds(0);
            } else {
                throw new Error(data.error || 'Failed to generate MCQ');
            }
        } catch (err) {
            alert(err.message);
            setPhase('setup');
        } finally {
            setMcqLoading(false);
        }
    };

    const abortInterview = () => {
        setShowAbortModal(true);
    };

    const confirmAbort = () => {
        setPhase('setup');
        setRoundIndex(0);
        setCurrentProblem(null);
        setRoundResults([]);
        setUsedProblemIds([]);
        setHint('');
        setHintCount(0);
        setRunOutput('');
        setShowAbortModal(false);
        setMcqQuestions([]);
        setSelectedTopics([]);
    };

    const submitMcq = () => {
        // Calculate score
        let score = 0;
        const results = mcqQuestions.map((q, idx) => {
            const isCorrect = mcqAnswers[idx] === q.correctOption;
            if (isCorrect) score += 1;
            return {
                question: q.question,
                correct: isCorrect,
                userAnswer: mcqAnswers[idx],
                correctAnswer: q.correctOption,
                explanation: q.explanation
            };
        });

        const accuracy = Math.round((score / mcqQuestions.length) * 100);
        const timeTaken = Math.floor((Date.now() - roundStartedAt) / 1000);

        // Prepare scorecard data
        const mcqScorecard = {
            summary: `You completed the MCQ interview with ${accuracy}% accuracy across ${selectedTopics.join(', ')}.`,
            overall: accuracy,
            metrics: {
                problemSolving: accuracy,
                codeQuality: 100, // Not applicable
                communication: 80,
                timeManagement: Math.max(40, 100 - Math.round(timeTaken / 60))
            },
            strengths: accuracy >= 80 ? ['Strong theoretical foundation', 'Quick recall of concepts'] : ['Good effort on varied topics'],
            improvements: accuracy < 80 ? ['Revise fundamental concepts in ' + (selectedTopics[0] || 'your chosen topics'), 'Practice more MCQs to improve speed'] : ['Deep dive into edge cases for ' + (selectedTopics[0] || 'your chosen topics')],
            nextWeekPlan: ['Focus on missed topics', 'Take another quiz in 3 days'],
            followUps: ['Can you explain why you chose ' + (mcqAnswers[0] || 'none') + ' for the first question?'],
            mcqResults: results
        };

        setScorecard(mcqScorecard);
        setPhase('scorecard');
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

        const modeData = INTERVIEW_MODES.find(m => m.id === selectedMode);
        if (hintCount >= modeData.hintLimit) {
            setHint(`${modeData.label} mode allows only ${modeData.hintLimit} hint${modeData.hintLimit === 1 ? '' : 's'} per round.`);
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
                    {(phase === 'live' || phase === 'live-mcq') && (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={abortInterview}
                                className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-900/10 text-xs font-medium transition-colors"
                            >
                                Abort Interview
                            </button>
                            <div className="px-3 py-2 rounded-lg bg-light-3 dark:bg-dark-4 text-sm flex items-center gap-2">
                                <FiClock />
                                {phase === 'live' ? 'Round time: ' : 'Time: '}{formatDuration(elapsedSeconds)}
                            </div>
                        </div>
                    )}
                </div>

                {phase === 'setup' && (
                    <div className="mt-4 space-y-6">
                        <div className="flex bg-light-3 dark:bg-dark-4 p-1 rounded-xl w-fit mx-auto mb-6">
                            <button
                                onClick={() => {
                                    setInterviewType('coding');
                                    setTotalRounds(3);
                                }}
                                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${interviewType === 'coding' ? 'bg-white dark:bg-dark-2 shadow-sm text-red-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-light-1'}`}
                            >
                                <div className="flex items-center gap-2"><FiTarget /> Coding Interview</div>
                            </button>
                            <button
                                onClick={() => {
                                    setInterviewType('mcq');
                                    setTotalRounds(10);
                                }}
                                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${interviewType === 'mcq' ? 'bg-white dark:bg-dark-2 shadow-sm text-red-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-light-1'}`}
                            >
                                <div className="flex items-center gap-2"><FiBookOpen /> MCQ Quiz</div>
                            </button>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <label className="text-sm">
                                <span className="block mb-1 text-gray-600 dark:text-gray-300 font-semibold">Number of {interviewType === 'coding' ? 'Rounds' : 'Questions'}</span>
                                <select
                                    className="w-full rounded-lg border border-light-4 dark:border-dark-4 bg-white dark:bg-dark-3 p-2 dark:text-light-1 outline-none"
                                    value={totalRounds}
                                    onChange={(e) => setTotalRounds(Number(e.target.value))}
                                >
                                    {interviewType === 'coding'
                                        ? [1, 2, 3, 4, 5].map((value) => (
                                            <option key={value} value={value} className="dark:bg-dark-3">
                                                {value} round{value > 1 ? 's' : ''}
                                            </option>
                                        ))
                                        : [10, 20, 30, 40, 50].map((value) => (
                                            <option key={value} value={value} className="dark:bg-dark-3">
                                                {value} questions
                                            </option>
                                        ))
                                    }
                                </select>
                            </label>

                            <label className="text-sm">
                                <span className="block mb-1 text-gray-600 dark:text-gray-300 font-semibold">Starting Difficulty</span>
                                <select
                                    className="w-full rounded-lg border border-light-4 dark:border-dark-4 bg-white dark:bg-dark-3 p-2 dark:text-light-1 outline-none"
                                    value={startDifficulty}
                                    onChange={(e) => setStartDifficulty(e.target.value)}
                                >
                                    {DIFFICULTIES.map((value) => <option key={value} value={value} className="dark:bg-dark-3">{value}</option>)}
                                </select>
                            </label>
                        </div>

                        {interviewType === 'coding' ? (
                            <div>
                                <span className="block mb-3 text-gray-600 dark:text-gray-300 font-semibold text-sm">Select Interview Mode</span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                    {INTERVIEW_MODES.map((m) => (
                                        <button
                                            key={m.id}
                                            onClick={() => setSelectedMode(m.id)}
                                            className={`flex flex-col p-3 rounded-xl border text-left transition-all ${selectedMode === m.id
                                                ? 'bg-red-50 border-red-500 ring-1 ring-red-500 dark:bg-red-900/10 dark:border-red-600'
                                                : 'bg-white border-light-4 hover:border-gray-400 dark:bg-dark-3 dark:border-dark-4 dark:hover:border-gray-500'
                                                }`}
                                        >
                                            <div className={`text-lg mb-1 ${selectedMode === m.id ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                                {m.icon}
                                            </div>
                                            <span className={`text-sm font-bold ${selectedMode === m.id ? 'text-red-700 dark:text-red-400' : 'text-dark-1 dark:text-light-1'}`}>{m.label}</span>
                                            <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-tight">{m.description}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <span className="block mb-3 text-gray-600 dark:text-gray-300 font-semibold text-sm">Select Topics (Select Multiple)</span>
                                <div className="flex flex-wrap gap-2">
                                    {availableTopics.map((topic) => (
                                        <button
                                            key={topic}
                                            onClick={() => toggleTopic(topic)}
                                            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border ${selectedTopics.includes(topic)
                                                ? 'bg-red-600 text-white border-red-600 shadow-md'
                                                : 'bg-white dark:bg-dark-3 text-gray-600 dark:text-gray-300 border-light-4 dark:border-dark-4 hover:border-red-500'
                                                }`}
                                        >
                                            {topic}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-center pt-2">
                            <button
                                onClick={startInterview}
                                className="px-8 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-all shadow-lg hover:shadow-red-500/20 flex items-center gap-2"
                            >
                                <FiPlay fill="currentColor" /> {interviewType === 'coding' ? 'Start Interview' : 'Generate Quiz'}
                            </button>
                        </div>
                    </div>
                )}

                {phase === 'live-mcq' && (
                    <div className="mt-4 space-y-6">
                        {mcqLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                <div className="animate-spin h-12 w-12 border-4 border-red-500 border-t-transparent rounded-full" />
                                <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse">Generating your custom technical assessment...</p>
                            </div>
                        ) : mcqQuestions.length > 0 ? (
                            <>
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex-grow">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-bold text-red-600 dark:text-red-400">Question {currentMcqIndex + 1} of {mcqQuestions.length}</span>
                                            {/* <span className="text-xs text-gray-400">Time elapsed: {formatDuration(elapsedSeconds)}</span> */}
                                        </div>
                                        <div className="w-full h-2 rounded-full bg-light-3 dark:bg-dark-4 overflow-hidden">
                                            <div
                                                className="h-full bg-red-500 transition-all duration-500"
                                                style={{ width: `${((currentMcqIndex + 1) / mcqQuestions.length) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-light-4 dark:border-dark-4 bg-white dark:bg-dark-2 p-6 shadow-sm">
                                    <h3 className="text-lg font-semibold text-dark-1 dark:text-light-1 mb-8 leading-relaxed">
                                        {mcqQuestions[currentMcqIndex].question}
                                    </h3>

                                    <div className="grid gap-4">
                                        {Object.entries(mcqQuestions[currentMcqIndex].options).map(([key, value]) => {
                                            const isSelected = mcqAnswers[currentMcqIndex] === key;
                                            return (
                                                <button
                                                    key={key}
                                                    onClick={() => setMcqAnswers({ ...mcqAnswers, [currentMcqIndex]: key })}
                                                    className={`group flex items-start gap-4 p-4 rounded-xl border transition-all ${isSelected
                                                        ? 'bg-red-50 border-red-500 ring-1 ring-red-500 dark:bg-red-900/10 dark:border-red-600'
                                                        : 'bg-light-2 dark:bg-dark-3 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                                                        }`}
                                                >
                                                    <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-colors ${isSelected
                                                        ? 'bg-red-600 text-white'
                                                        : 'bg-white dark:bg-dark-4 text-gray-500 group-hover:text-dark-1 dark:group-hover:text-light-1'
                                                        }`}>
                                                        {key}
                                                    </div>
                                                    <span className={`text-sm text-left leading-relaxed ${isSelected ? 'text-red-700 dark:text-red-300 font-medium' : 'text-gray-700 dark:text-gray-300'}`}>
                                                        {value}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4">
                                    <button
                                        disabled={currentMcqIndex === 0}
                                        onClick={() => setMcqIndex(prev => prev - 1)}
                                        className="px-6 py-2 rounded-xl border border-light-4 dark:border-dark-4 text-sm font-semibold hover:bg-light-3 dark:hover:bg-dark-4 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    >
                                        Previous
                                    </button>

                                    {currentMcqIndex === mcqQuestions.length - 1 ? (
                                        <button
                                            onClick={submitMcq}
                                            disabled={Object.keys(mcqAnswers).length < mcqQuestions.length}
                                            className="px-8 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-500/20 disabled:opacity-50 transition-all active:scale-95"
                                        >
                                            Finish Quiz
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setMcqIndex(prev => prev + 1)}
                                            className="px-8 py-2.5 rounded-xl bg-dark-4 dark:bg-light-4 text-white dark:text-dark-1 font-bold shadow-md hover:bg-dark-1 dark:hover:bg-white transition-all active:scale-95"
                                        >
                                            Next Question
                                        </button>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-20 text-gray-500">Failed to load questions. Please try again.</div>
                        )}
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
                                <div className="flex items-center justify-between">
                                    <h4 className="font-semibold text-sm dark:text-light-1">Round Controls</h4>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 uppercase tracking-wider">
                                        {selectedMode}
                                    </span>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    <LanguagesDropdown onSelectChange={handleLanguageChange} value={language} />
                                    <ThemeDropdown handleThemeChange={setTheme} />
                                    <FontSizeDropdown onSelectChange={setFontSize} />
                                </div>
                                <button
                                    onClick={requestHint}
                                    className="w-full px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-900/10 text-sm font-bold transition-colors flex items-center justify-center gap-2"
                                >
                                    <BsLightbulb size={14} />
                                    Get Hint ({hintCount}{INTERVIEW_MODES.find(m => m.id === selectedMode).hintLimit === Infinity ? '/∞' : `/${INTERVIEW_MODES.find(m => m.id === selectedMode).hintLimit}`})
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
                                <span className="block mb-1 text-gray-600 dark:text-gray-300 font-semibold">Custom Input</span>
                                <textarea
                                    value={customInput}
                                    onChange={(e) => setCustomInput(e.target.value)}
                                    rows={4}
                                    className="w-full rounded-lg border border-light-4 dark:border-dark-4 bg-white dark:bg-dark-2 p-2 dark:text-light-1 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all"
                                    placeholder="Enter test input"
                                />
                            </label>

                            <div className="flex items-center gap-2 flex-wrap justify-end">
                                <button
                                    onClick={runCode}
                                    disabled={isRunning}
                                    className="px-4 py-2 rounded-lg border border-light-4 dark:border-dark-4 text-sm hover:bg-light-3 dark:hover:bg-dark-4 transition-colors"
                                >
                                    <span className="inline-flex items-center gap-2"><FiPlay />{isRunning ? 'Running...' : 'Run'}</span>
                                </button>
                                <button
                                    onClick={submitRound}
                                    disabled={isSubmitting}
                                    className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-all shadow-md active:scale-95"
                                >
                                    <span className="inline-flex items-center gap-2"><FiSend />{isSubmitting ? 'Submitting...' : 'Submit Round'}</span>
                                </button>
                            </div>

                            <div className="rounded-lg bg-light-3 dark:bg-dark-4 p-3 text-sm whitespace-pre-wrap min-h-[80px] font-mono">
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
                                Start New Session
                            </button>
                        </div>

                        {buildingScorecard && (
                            <div className="text-sm text-gray-500 dark:text-gray-300 flex items-center gap-2">
                                <div className="animate-spin h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full" />
                                Generating AI scorecard...
                            </div>
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

                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{scorecard.summary}</p>

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
                                    <h4 className="font-semibold text-sm mb-2 inline-flex items-center gap-2"><FiTarget className="text-red-500" /> 7-Day Plan</h4>
                                    <ul className="text-sm list-disc pl-5 space-y-1">
                                        {(scorecard.nextWeekPlan || []).map((item, idx) => <li key={idx}>{item}</li>)}
                                    </ul>
                                </div>

                                <div className="rounded-lg border border-light-4 dark:border-dark-4 p-3">
                                    <h4 className="font-semibold text-sm mb-2 inline-flex items-center gap-2"><FiChevronRight className="text-blue-500" /> Follow-up Interview Questions</h4>
                                    <ul className="text-sm list-disc pl-5 space-y-1">
                                        {(scorecard.followUps || []).map((item, idx) => <li key={idx}>{item}</li>)}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {!buildingScorecard && !scorecard && (
                            <div className="text-sm text-gray-500 dark:text-gray-300">Scorecard unavailable. Try another interview round.</div>
                        )}

                        {roundResults.length > 0 && (
                            <div className="rounded-lg border border-light-4 dark:border-dark-4 p-3">
                                <h4 className="font-semibold text-sm mb-2">Round Results</h4>
                                <div className="space-y-2">
                                    {roundResults.map((r) => (
                                        <div key={`${r.round}-${r.problemId}`} className="text-sm flex items-center justify-between rounded-md bg-light-3 dark:bg-dark-4 p-2">
                                            <span className="font-medium">R{r.round} - {r.title} ({r.difficulty})</span>
                                            <div className="flex items-center gap-3">
                                                <span className={`font-bold ${r.accepted ? 'text-green-600' : 'text-red-600'}`}>{r.accepted ? 'Accepted' : 'Rejected'}</span>
                                                <span className="text-gray-400">|</span>
                                                <span>{r.passedTestCases}/{r.totalTestCases}</span>
                                                <span className="text-gray-400">|</span>
                                                <span>{formatDuration(r.timeTakenSec)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {scorecard.mcqResults && (
                            <div className="rounded-lg border border-light-4 dark:border-dark-4 p-3">
                                <h4 className="font-semibold text-sm mb-4">Assessment Details</h4>
                                <div className="space-y-4">
                                    {scorecard.mcqResults.map((r, idx) => (
                                        <div key={idx} className="border-b border-light-4 dark:border-dark-4 pb-4 last:border-0">
                                            <div className="flex items-start gap-3 mb-2">
                                                <div className={`mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${r.correct ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                    {r.correct ? <FiCheckCircle size={14} /> : <FiAlertCircle size={14} />}
                                                </div>
                                                <p className="text-sm font-medium text-dark-1 dark:text-light-1">{r.question}</p>
                                            </div>
                                            <div className="ml-8 space-y-1">
                                                <p className="text-xs text-gray-500">Your answer: <span className={r.correct ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{r.userAnswer}</span></p>
                                                {!r.correct && <p className="text-xs text-green-600 font-bold">Correct answer: {r.correctAnswer}</p>}
                                                <p className="text-xs text-gray-500 italic mt-2 bg-light-3 dark:bg-dark-4 p-2 rounded">{r.explanation}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Abort Confirmation Modal */}
            {showAbortModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-dark-2 rounded-2xl border border-light-4 dark:border-dark-4 shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
                        <div className="p-6 text-center">
                            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                                <FiAlertTriangle className="text-red-600 dark:text-red-500" size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-dark-1 dark:text-light-1 mb-2">Abort Interview?</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                                Are you sure you want to end this session? All progress, hints used, and current round data will be permanently lost.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowAbortModal(false)}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-light-4 dark:border-dark-4 text-sm font-semibold hover:bg-light-3 dark:hover:bg-dark-4 transition-colors"
                                >
                                    Continue Practice
                                </button>
                                <button
                                    onClick={confirmAbort}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold shadow-lg shadow-red-500/20 transition-all active:scale-95"
                                >
                                    End Session
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

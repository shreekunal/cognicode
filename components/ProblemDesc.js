import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { AiOutlineLike, AiFillLike, AiOutlineDislike, AiFillDislike } from "react-icons/ai";
import { FaRegStar, FaStar } from "react-icons/fa";
import { TiInputChecked } from "react-icons/ti";
import { FiHelpCircle, FiCompass, FiTarget, FiClock, FiCheckCircle, FiXCircle, FiCpu, FiDatabase } from "react-icons/fi";
import { BsLightbulb } from "react-icons/bs";
import TextSolutions from './TextSolutions';
import AIRecommendation from './AIRecommendation';

const ProblemDesc = ({ problems }) => {

    const params = useParams();
    const [clickedProblems, setClickedProblems] = useState();
    const [clickedProblemsId, setClickedProblemId] = useState();
    const [like, setLike] = useState(false);
    const [disLike, setDisLike] = useState(false);
    const [favorite, setFavorite] = useState(false);
    const [hintLevel, setHintLevel] = useState(0);
    const [hints, setHints] = useState([]);
    const [hintLoading, setHintLoading] = useState(false);
    const [hintError, setHintError] = useState(null);
    const [activeTab, setActiveTab] = useState('description');
    const [submissions, setSubmissions] = useState([]);
    const [submissionsLoading, setSubmissionsLoading] = useState(false);
    const [expandedSubmission, setExpandedSubmission] = useState(null);
    const difficultyColors = {
        'Hard': 'bg-red-700',
        'Medium': 'bg-red-500',
        'Easy': 'bg-red-300 text-red-900'
    };

    useEffect(() => {
        if (problems) {
            problems.forEach((problem, index) => {
                if (problem.id === params.id) {
                    setClickedProblems(problem);
                    setClickedProblemId(problem._id);
                }
            })
        }

    }, [problems]);

    const fetchHint = async () => {
        if (hintLevel >= 3) return;
        const nextLevel = hintLevel + 1;
        setHintLoading(true);
        setHintError(null);
        try {
            const res = await fetch('/api/ai/hint', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    problemTitle: clickedProblems?.title || '',
                    problemStatement: (clickedProblems?.problemStatement || '').replace(/<[^>]*>/g, ''),
                    difficulty: clickedProblems?.difficulty || 'Medium',
                    hintLevel: nextLevel,
                }),
            });
            const data = await res.json();
            if (!data.ok) throw new Error(data.error || 'Failed to get hint');
            setHints(prev => [...prev, { level: nextLevel, text: data.hint }]);
            setHintLevel(nextLevel);
        } catch (err) {
            setHintError(err.message);
        } finally {
            setHintLoading(false);
        }
    };

    const hintIcons = [<BsLightbulb key="nudge" className="inline" />, <FiCompass key="approach" className="inline" />, <FiTarget key="strong" className="inline" />];
    const hintLabels = ['Nudge', 'Approach', 'Strong Hint'];

    const fetchSubmissions = async () => {
        if (!params?.id) return;
        setSubmissionsLoading(true);
        try {
            const res = await fetch(`/api/getSubmissions?problemId=${params.id}`);
            const data = await res.json();
            if (data.ok) setSubmissions(data.submissions || []);
        } catch (e) { /* ignore */ }
        finally { setSubmissionsLoading(false); }
    };

    useEffect(() => {
        if (activeTab === 'submissions' && submissions.length === 0) {
            fetchSubmissions();
        }
    }, [activeTab]);

    return (
        <div className='w-full flex flex-col overflow-x-hidden overflow-y-auto px-1'>
            <div className='flex h-11 w-full items-center pt-2 bg-light-3 dark:bg-dark-4 rounded-t-lg px-2'>
                <button
                    onClick={() => setActiveTab('description')}
                    className={`rounded-t-md px-5 py-[10px] text-sm cursor-pointer transition-colors ${activeTab === 'description' ? 'bg-light-2 dark:bg-dark-3 dark:text-light-1' : 'text-gray-500 dark:text-gray-400 hover:text-dark-1 dark:hover:text-light-1'}`}
                >
                    Description
                </button>
                <button
                    onClick={() => setActiveTab('submissions')}
                    className={`rounded-t-md px-5 py-[10px] text-sm cursor-pointer transition-colors ${activeTab === 'submissions' ? 'bg-light-2 dark:bg-dark-3 dark:text-light-1' : 'text-gray-500 dark:text-gray-400 hover:text-dark-1 dark:hover:text-light-1'}`}
                >
                    Submissions
                </button>
            </div>
            <div className='bg-light-2 dark:bg-dark-3 dark:text-light-1 rounded-b-lg flex-grow'>

                {/* ===== DESCRIPTION TAB ===== */}
                <div className={activeTab !== 'description' ? 'hidden' : ''}>
                    <h2 className='font-semibold text-xl p-5'>
                        {clickedProblems?.order}. {clickedProblems?.title}
                    </h2>
                    {/* section 1 */}
                    <div className='flex items-center justify-start px-5 mt-1 mb-2'>
                        <div className={`px-4 py-1 rounded-full text-sm text-light-1 ${difficultyColors[clickedProblems?.difficulty]}`} >
                            {clickedProblems?.difficulty}
                        </div>
                        {/*  Solved Section  */}
                        <div className='mx-2 cursor-pointer' >
                            <TiInputChecked size={30} className='text-red-500' />
                        </div>
                    </div>
                    {/* section 2 */}
                    <div className='px-5 py-2'>
                        {/* For HTML content Rendering */}
                        <div dangerouslySetInnerHTML={{ __html: clickedProblems?.problemStatement || '' }} />
                    </div>
                    {/* section 3 */}
                    <div className='mt-4 px-5'>
                        <h2 className='font-bold'>Input Format</h2>
                        <div dangerouslySetInnerHTML={{ __html: clickedProblems?.inputFormat || '' }} />
                    </div>
                    <div className='mt-4 px-5'>
                        <h2 className='font-bold'>Output Format</h2>
                        <div dangerouslySetInnerHTML={{ __html: clickedProblems?.outputFormat || '' }} />
                    </div>
                    <div className='mt-4 px-5'>
                        <h2 className='font-bold'>Sample Input</h2>
                        <div className='bg-light-3 dark:bg-dark-4 font-mono mt-1 py-2 px-3 rounded-lg'>
                            <div dangerouslySetInnerHTML={{ __html: clickedProblems?.sampleInput || '' }} />
                        </div>
                    </div>
                    <div className='mt-4 px-5'>
                        <h2 className='font-bold'>Sample Output</h2>
                        <div className='bg-light-3 dark:bg-dark-4 font-mono mt-1 py-2 px-3 rounded-lg'>
                            <div dangerouslySetInnerHTML={{ __html: clickedProblems?.sampleOutput || '' }} />
                        </div>
                    </div>
                    <div className='mt-2 px-5 py-2'>
                        {clickedProblems?.constraints && (
                            <>
                                <p className='font-bold'>Constraints:</p>
                                <div className='font-medium'
                                    dangerouslySetInnerHTML={{ __html: clickedProblems?.constraints || '' }}
                                />
                            </>
                        )}
                    </div>

                    {/* Hint Section */}
                    <div className='mt-4 px-5 py-3 border-t border-light-3 dark:border-dark-4'>
                        <div className='flex items-center justify-between mb-2'>
                            <h3 className='font-bold flex items-center gap-2'>
                                <FiHelpCircle className='text-red-500' /> Need a Hint?
                            </h3>
                            <button
                                onClick={fetchHint}
                                disabled={hintLoading || hintLevel >= 3}
                                className='px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5'
                            >
                                {hintLoading ? 'Thinking...' : hintLevel >= 3 ? 'All hints used' : <>{hintIcons[hintLevel]} {hintLabels[hintLevel]}</>}
                            </button>
                        </div>
                        {/* Hint level dots */}
                        <div className='flex gap-1.5 mb-2'>
                            {[1, 2, 3].map(l => (
                                <div key={l} className={`h-1.5 flex-1 rounded-full ${l <= hintLevel ? 'bg-red-500' : 'bg-gray-300 dark:bg-dark-4'}`} />
                            ))}
                        </div>
                        {hintError && (
                            <div className='text-sm text-red-500 mb-2'>{hintError}</div>
                        )}
                        {hints.map((h, i) => (
                            <div key={i} className='mb-2 p-3 bg-light-3 dark:bg-dark-4 rounded-lg text-sm'>
                                <span className='font-semibold text-light-1-contrast dark:text-light-4'>Hint {h.level}: </span>
                                {h.text}
                            </div>
                        ))}
                    </div>

                    {/* AI Recommendation Section */}
                    <div className='mt-6 px-5 py-4 border-t border-light-3 dark:border-dark-4'>
                        <AIRecommendation
                            currentDifficulty={clickedProblems?.difficulty || 'Medium'}
                        />
                    </div>
                </div>

                {/* ===== SUBMISSIONS TAB ===== */}
                <div className={activeTab !== 'submissions' ? 'hidden' : 'p-5'}>
                    <h2 className='font-semibold text-xl mb-4'>Submissions</h2>

                    {submissionsLoading && (
                        <div className='text-sm text-gray-500 dark:text-gray-400'>Loading submissions...</div>
                    )}

                    {!submissionsLoading && submissions.length === 0 && (
                        <div className='text-sm text-gray-400 dark:text-gray-500 py-8 text-center'>
                            No submissions yet. Submit your code to see results here.
                        </div>
                    )}

                    {submissions.length > 0 && (
                        <div className='space-y-2'>
                            {submissions.map((sub, i) => (
                                <div key={i} className='rounded-lg border border-light-4 dark:border-dark-4 overflow-hidden'>
                                    <button
                                        onClick={() => setExpandedSubmission(expandedSubmission === i ? null : i)}
                                        className='w-full flex items-center justify-between px-4 py-3 hover:bg-light-3 dark:hover:bg-dark-4 transition-colors'
                                    >
                                        <div className='flex items-center gap-3'>
                                            {sub.status === 'accepted' ? (
                                                <FiCheckCircle className='text-green-500' size={18} />
                                            ) : (
                                                <FiXCircle className='text-red-500' size={18} />
                                            )}
                                            <span className={`text-sm font-semibold ${sub.status === 'accepted' ? 'text-green-500' : 'text-red-500'}`}>
                                                {sub.status === 'accepted' ? 'Accepted' : 'Rejected'}
                                            </span>
                                            <span className='text-xs text-gray-400'>
                                                {sub.passedTestCases} test cases passed
                                            </span>
                                        </div>
                                        <div className='flex items-center gap-3 text-xs text-gray-400'>
                                            <span className='flex items-center gap-1'><FiClock size={12} /> {new Date(sub.submittedAt).toLocaleString()}</span>
                                        </div>
                                    </button>

                                    {expandedSubmission === i && (
                                        <div className='border-t border-light-4 dark:border-dark-4 p-4 space-y-3'>
                                            <div className='flex gap-4 text-xs'>
                                                <span className='flex items-center gap-1.5 px-2 py-1 bg-light-3 dark:bg-dark-4 rounded'>
                                                    <FiCpu size={12} /> CPU: {sub.cpuTime}ms
                                                </span>
                                                <span className='flex items-center gap-1.5 px-2 py-1 bg-light-3 dark:bg-dark-4 rounded'>
                                                    <FiDatabase size={12} /> Memory: {sub.memory}KB
                                                </span>
                                            </div>
                                            <div className='bg-light-3 dark:bg-dark-4 rounded-lg p-3 overflow-auto max-h-64'>
                                                <pre className='text-xs font-mono whitespace-pre-wrap'>{sub.code}</pre>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    )
}

export default ProblemDesc

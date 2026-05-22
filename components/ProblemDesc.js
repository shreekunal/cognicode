import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { AiOutlineLike, AiFillLike, AiOutlineDislike, AiFillDislike } from "react-icons/ai";
import { FaRegStar, FaStar } from "react-icons/fa";
import { TiInputChecked } from "react-icons/ti";
import { FiClock, FiCheckCircle, FiXCircle, FiCpu, FiDatabase, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { BsStars } from "react-icons/bs";
import TextSolutions from './TextSolutions';
import AIRecommendation from './AIRecommendation';
import AskCogni from './AskCogni';

const ProblemDesc = ({ problems, code, language }) => {

    const params = useParams();
    const [clickedProblems, setClickedProblems] = useState();
    const [clickedProblemsId, setClickedProblemId] = useState();
    const [like, setLike] = useState(false);
    const [disLike, setDisLike] = useState(false);
    const [favorite, setFavorite] = useState(false);
    const [activeTab, setActiveTab] = useState('description');
    const [submissions, setSubmissions] = useState([]);
    const [submissionsLoading, setSubmissionsLoading] = useState(false);
    const [expandedSubmission, setExpandedSubmission] = useState(null);

    const difficultyColors = {
        'Easy': 'bg-green-500',
        'Medium': 'bg-yellow-500',
        'Hard': 'bg-red-500'
    }

    useEffect(() => {
        if (problems) {
            problems.map((problem) => {
                if (problem.id === params.id) {
                    setClickedProblems(problem)
                    setClickedProblemId(problem.id)
                }
            })
        }

    }, [problems, params.id]);

    const fetchSubmissions = async () => {
        if (!params?.id) return;
        setSubmissionsLoading(true);
        try {
            const res = await fetch(`/api/getSubmissions?problemId=${params.id}`);
            const data = await res.json();
            if (data.ok) {
                setSubmissions(data.submissions);
            }
        } catch (err) {
            console.error("Failed to fetch submissions:", err);
        } finally {
            setSubmissionsLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'submissions' && submissions.length === 0) {
            fetchSubmissions();
        }
    }, [activeTab]);

    return (
        <div className='w-full h-full min-h-0 flex flex-col overflow-x-hidden overflow-hidden px-1'>
            <div className='flex h-11 w-full items-center pt-2 bg-light-3 dark:bg-dark-4 rounded-t-lg px-2'>
                <button
                    onClick={() => setActiveTab('description')}
                    className={`rounded-t-md px-5 py-[10px] text-sm cursor-pointer transition-colors ${activeTab === 'description' ? 'bg-light-2 dark:bg-dark-3 dark:text-light-1' : 'text-gray-500 dark:text-gray-400 hover:text-dark-1 dark:hover:text-light-1'}`}
                >
                    Description
                </button>
                <button
                    onClick={() => setActiveTab('ask-cogni')}
                    className={`rounded-t-md px-5 py-[10px] text-sm cursor-pointer transition-colors font-semibold flex items-center gap-2 ${activeTab === 'ask-cogni' ? 'bg-light-2 dark:bg-dark-3 text-red-600 dark:text-red-400' : 'text-red-500/70 dark:text-red-400/70 hover:text-red-600 dark:hover:text-red-400'}`}
                >
                    <BsStars size={14} className={activeTab === 'ask-cogni' ? 'text-red-600' : 'text-red-500'} />
                    Ask Cogni
                </button>
                <button
                    onClick={() => setActiveTab('submissions')}
                    className={`rounded-t-md px-5 py-[10px] text-sm cursor-pointer transition-colors ${activeTab === 'submissions' ? 'bg-light-2 dark:bg-dark-3 dark:text-light-1' : 'text-gray-500 dark:text-gray-400 hover:text-dark-1 dark:hover:text-light-1'}`}
                >
                    Submissions
                </button>
            </div>
            <div className='bg-light-2 dark:bg-dark-3 dark:text-light-1 rounded-b-lg flex-grow min-h-0 overflow-y-auto'>

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

                    {/* AI Recommendation Section */}
                    <div className='mt-6 px-5 py-4 border-t border-light-3 dark:border-dark-4'>
                        <AIRecommendation
                            currentDifficulty={clickedProblems?.difficulty || 'Medium'}
                        />
                    </div>
                </div>

                {/* ===== ASK COGNI TAB ===== */}
                <div className={activeTab !== 'ask-cogni' ? 'hidden' : 'h-full'}>
                    <AskCogni problem={clickedProblems} code={code} language={language} />
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
                                <div key={i} className='border border-light-4 dark:border-dark-4 rounded-lg overflow-hidden'>
                                    <div 
                                        className='flex items-center justify-between px-4 py-3 bg-light-3/50 dark:bg-dark-4/50 cursor-pointer hover:bg-light-3 dark:hover:bg-dark-4 transition-colors'
                                        onClick={() => setExpandedSubmission(expandedSubmission === i ? null : i)}
                                    >
                                        <div className='flex items-center gap-4'>
                                            <span className={`text-xs font-bold uppercase tracking-wider ${sub.isAccepted === 'accepted' ? 'text-green-500' : 'text-red-500'}`}>
                                                {sub.isAccepted === 'accepted' ? 'Accepted' : 'Rejected'}
                                            </span>
                                            <span className='text-xs text-gray-500 dark:text-gray-400'>
                                                {new Date(sub.submittedAt).toLocaleString()}
                                            </span>
                                            <span className='text-[10px] bg-light-4 dark:bg-dark-3 px-2 py-0.5 rounded uppercase font-bold text-gray-500 dark:text-gray-400'>
                                                {sub.language}
                                            </span>
                                        </div>
                                        {expandedSubmission === i ? <FiChevronUp /> : <FiChevronDown />}
                                    </div>
                                    {expandedSubmission === i && (
                                        <div className='p-4 bg-white dark:bg-dark-2 border-t border-light-4 dark:border-dark-4'>
                                            <pre className='font-mono text-xs text-dark-1 dark:text-light-1 overflow-x-auto p-3 bg-light-2 dark:bg-dark-3 rounded'>
                                                {sub.code}
                                            </pre>
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

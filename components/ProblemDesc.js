import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { AiOutlineLike, AiFillLike, AiOutlineDislike, AiFillDislike } from "react-icons/ai";
import { FaRegStar, FaStar } from "react-icons/fa";
import { TiInputChecked } from "react-icons/ti";
import { FiClock, FiCheckCircle, FiXCircle, FiCpu, FiDatabase, FiChevronDown, FiChevronUp, FiBarChart2 } from "react-icons/fi";
import { BsStars } from "react-icons/bs";
import AIRecommendation from './AIRecommendation';
import AskCogni from './AskCogni';
import CodeReview from './CodeReview';
import ComplexityAnalysis from './ComplexityAnalysis';
import PerformanceGraph from './PerformanceGraph';

const ProblemDesc = ({ problems, code, language, solved, submissionResult, activeTab: externalTab, setActiveTab: setExternalTab }) => {

    const params = useParams();
    const [clickedProblems, setClickedProblems] = useState();
    const [clickedProblemsId, setClickedProblemId] = useState();
    const [like, setLike] = useState(false);
    const [disLike, setDisLike] = useState(false);
    const [favorite, setFavorite] = useState(false);
    const [internalTab, setInternalTab] = useState('description');
    const [submissions, setSubmissions] = useState([]);
    const [submissionsLoading, setSubmissionsLoading] = useState(false);
    const [expandedSubmission, setExpandedSubmission] = useState(null);
    const [solutionLanguage, setSolutionLanguage] = useState('python3');

    const activeTab = externalTab || internalTab;
    const setActiveTab = setExternalTab || setInternalTab;

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
            const res = await fetch(`/cognicode/api/getSubmissions?problemId=${params.id}`);
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

    useEffect(() => {
        fetchSubmissions();
    }, [params.id, solved]);

    const isSolved = solved || submissions.some(sub => sub.isAccepted === 'accepted');

    const formatDate = (dateString) => {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return 'Invalid Date';
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = String(d.getFullYear()).slice(-2);
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${day} ${month} ${year}, ${hours}:${minutes}`;
    };

    return (
        <div className='w-full h-full min-h-0 flex flex-col overflow-x-hidden overflow-hidden px-1 pb-1.5'>
            <div className='flex h-11 w-full items-center pt-2 bg-light-3 dark:bg-dark-4 rounded-t-lg px-1'>
                <button
                    onClick={() => setActiveTab('description')}
                    className={`rounded-t-md px-3 py-[8px] text-sm cursor-pointer transition-colors ${activeTab === 'description' ? 'bg-light-2 dark:bg-dark-3 dark:text-light-1' : 'text-gray-500 dark:text-gray-400 hover:text-dark-1 dark:hover:text-light-1'}`}
                >
                    Description
                </button>
                <button
                    onClick={() => setActiveTab('solutions')}
                    className={`rounded-t-md px-3 py-[8px] text-sm cursor-pointer transition-colors ${activeTab === 'solutions' ? 'bg-light-2 dark:bg-dark-3 dark:text-light-1' : 'text-gray-500 dark:text-gray-400 hover:text-dark-1 dark:hover:text-light-1'}`}
                >
                    Solutions
                </button>
                <button
                    onClick={() => setActiveTab('ask-cogni')}
                    className={`rounded-t-md px-3 py-[8px] text-sm cursor-pointer transition-colors font-semibold flex items-center gap-1 ${activeTab === 'ask-cogni' ? 'bg-light-2 dark:bg-dark-3 text-red-600 dark:text-red-400' : 'text-red-500/70 dark:text-red-400/70 hover:text-red-600 dark:hover:text-red-400'}`}
                >
                    <BsStars size={12} className={activeTab === 'ask-cogni' ? 'text-red-600' : 'text-red-500'} />
                    Ask Cogni
                </button>
                <button
                    onClick={() => setActiveTab('submissions')}
                    className={`rounded-t-md px-3 py-[8px] text-sm cursor-pointer transition-colors ${activeTab === 'submissions' ? 'bg-light-2 dark:bg-dark-3 dark:text-light-1' : 'text-gray-500 dark:text-gray-400 hover:text-dark-1 dark:hover:text-light-1'}`}
                >
                    Submissions
                </button>
                {isSolved && (
                    <button
                        onClick={() => setActiveTab('analysis')}
                        className={`rounded-t-md px-5 py-[10px] text-sm cursor-pointer transition-colors flex items-center gap-2 ${activeTab === 'analysis' ? 'bg-light-2 dark:bg-dark-3 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-dark-1 dark:hover:text-light-1'}`}
                    >
                        <FiBarChart2 size={14} className={activeTab === 'analysis' ? 'text-indigo-600' : 'text-gray-500'} />
                        Analysis
                    </button>
                )}
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
                        {isSolved && (
                            <div className='mx-2 cursor-pointer' >
                                <TiInputChecked size={30} className='text-green-500' />
                            </div>
                        )}
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

                {/* ===== SOLUTIONS TAB ===== */}
                <div className={activeTab !== 'solutions' ? 'hidden' : 'p-5'}>
                    <h2 className='font-semibold text-xl mb-4'>Official Solutions</h2>
                    <div className='flex gap-2 mb-4 overflow-x-auto pb-2'>
                        {['python3', 'cpp', 'java', 'nodejs'].map((lang) => (
                            <button
                                key={lang}
                                onClick={() => setSolutionLanguage(lang)}
                                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                                    (solutionLanguage === lang)
                                    ? 'bg-red-500 text-white border-red-500' 
                                    : 'bg-light-3 dark:bg-dark-4 text-gray-500 border-transparent hover:border-light-4'
                                }`}
                            >
                                {lang === 'python3' ? 'Python' : lang.toUpperCase()}
                            </button>
                        ))}
                    </div>
                    
                    <div className='bg-white dark:bg-dark-2 border border-light-4 dark:border-dark-4 rounded-lg overflow-hidden'>
                        <div className='p-4'>
                            <pre className='font-mono text-xs text-dark-1 dark:text-light-1 overflow-x-auto p-3 bg-light-2 dark:bg-dark-3 rounded leading-relaxed'>
                                {clickedProblems?.solutions?.[solutionLanguage] || '// No solution available for this language yet.'}
                            </pre>
                        </div>
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
                                                {formatDate(sub.submittedAt)}
                                            </span>
                                            <span className='text-[10px] text-gray-400 font-medium'>
                                                {Math.round(parseFloat(sub.cpuTime || 0) * 1000)} ms
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

                {/* ===== ANALYSIS TAB ===== */}
                <div className={activeTab !== 'analysis' ? 'hidden' : 'p-5 space-y-6'}>
                    <h2 className='font-semibold text-xl'>Solution Analysis</h2>
                    
                    {/* Performance Stats Section */}
                    {submissionResult && (
                        <>
                        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                            <div className='bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex flex-col items-center justify-center text-center'>
                                <span className='text-[10px] uppercase font-bold text-green-600 dark:text-green-400 tracking-wider mb-1'>Test Cases</span>
                                <span className='text-2xl font-bold text-green-700 dark:text-green-300'>{submissionResult.passedTestCases} / {submissionResult.totalTestCases}</span>
                                <span className='text-[10px] text-green-600/70 dark:text-green-400/70 font-medium mt-1'>Passed</span>
                            </div>
                            <div className='bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex flex-col items-center justify-center text-center'>
                                <span className='text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wider mb-1'>Runtime</span>
                                <span className='text-2xl font-bold text-blue-700 dark:text-blue-300'>{Math.round(parseFloat(submissionResult.cpuTime || 0) * 1000)} ms</span>
                                <span className='text-[10px] text-blue-600/70 dark:text-blue-400/70 font-medium mt-1'>Execution Time</span>
                            </div>
                            <div className='bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 flex flex-col items-center justify-center text-center'>
                                <span className='text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 tracking-wider mb-1'>Memory</span>
                                <span className='text-2xl font-bold text-purple-700 dark:text-purple-300'>{Math.round(parseFloat(submissionResult.memory || 0) / 1024)} KB</span>
                                <span className='text-[10px] text-purple-600/70 dark:text-purple-400/70 font-medium mt-1'>Usage</span>
                            </div>
                        </div>

                        {/* Performance Graphs Section */}
                        <div className='bg-white dark:bg-dark-2 rounded-xl p-6 border border-light-4 dark:border-dark-4 shadow-sm space-y-10'>
                            <PerformanceGraph 
                                type="Runtime"
                                userValue={parseFloat(submissionResult.cpuTime || 0) * 1000}
                                label="Runtime"
                                unit="ms"
                            />
                            <PerformanceGraph 
                                type="Memory"
                                userValue={parseFloat(submissionResult.memory || 0) / 1024}
                                label="Memory"
                                unit="KB"
                            />
                        </div>
                        </>
                    )}

                    <div className='space-y-8'>
                        <div className='bg-white dark:bg-dark-2 rounded-xl p-5 border border-light-4 dark:border-dark-4 shadow-sm'>
                            <h3 className='text-sm font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2'>
                                <FiCheckCircle className='text-green-500' /> Code Analysis
                            </h3>
                            <CodeReview 
                                code={code} 
                                language={language?.label || 'javascript'} 
                                autoFetch={activeTab === 'analysis' && solved} 
                            />
                        </div>

                        <div className='bg-white dark:bg-dark-2 rounded-xl p-5 border border-light-4 dark:border-dark-4 shadow-sm'>
                            <h3 className='text-sm font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2'>
                                <FiCpu className='text-blue-500' /> Complexity
                            </h3>
                            <ComplexityAnalysis 
                                code={code} 
                                language={language?.label || 'javascript'} 
                                autoFetch={activeTab === 'analysis' && solved} 
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProblemDesc

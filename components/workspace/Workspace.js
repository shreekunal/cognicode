'use client'
import Split from "react-split";
import ProblemDesc from "../ProblemDesc";
import Playground from "./Playground";
import { useState, useEffect } from "react";
import Confetti from "react-confetti";
import { languagesData, mockComments, getStarterForLanguage } from "@/constants";
import { useParams } from "next/navigation";


const Workspace = ({ problems }) => {
	const params = useParams();
	const [submissionResult, setSubmissionResult] = useState(null);
	const [showConfetti, setShowConfetti] = useState(false);
	const [language, setLanguage] = useState(languagesData[3]);
	const [code, setCode] = useState(mockComments[language.value]);
	const [clickedProblemId, setClickedProblemId] = useState(null);
	const [activeTab, setActiveTab] = useState('description');

	const getStorageKey = (problemId, lang) => `cognicode_code_${problemId}_${lang}`;

	useEffect(() => {
		if (problems) {
			const problem = problems.find((p) => p.id === params.id);
			if (problem) {
				setClickedProblemId(problem.id);
				// Try to restore saved code from localStorage first
				const savedCode = typeof window !== 'undefined'
					? localStorage.getItem(getStorageKey(problem.id, language.value))
					: null;
				if (savedCode) {
					setCode(savedCode);
				} else if (problem.starterCode) {
					setCode(getStarterForLanguage(problem.starterCode, language.value));
				}
			}
		}
	}, [problems, params.id]);

	// Auto-save code to localStorage on change (debounced)
	useEffect(() => {
		if (!clickedProblemId || !code) return;
		const timer = setTimeout(() => {
			try {
				localStorage.setItem(getStorageKey(clickedProblemId, language.value), code);
			} catch (e) { /* quota exceeded, ignore */ }
		}, 500);
		return () => clearTimeout(timer);
	}, [code, clickedProblemId, language.value]);

	// Switch to analysis tab when submitted
	useEffect(() => {
		if (submissionResult?.isAccepted === 'accepted') {
			setActiveTab('analysis');
			setShowConfetti(true);
			const timer = setTimeout(() => setShowConfetti(false), 5000);
			return () => clearTimeout(timer);
		}
	}, [submissionResult]);

	return (
		<div className="w-full h-[calc(100vh-var(--nav-height,9vh)-1vh)] overflow-hidden flex flex-col">
			{showConfetti && <Confetti gravity={0.3} tweenDuration={5000} />}
			<Split className='split px-1 flex-grow max-md:hidden overflow-hidden' minSize={500}>
				<ProblemDesc 
					problems={problems} 
					code={code} 
					language={language} 
					solved={submissionResult?.isAccepted === 'accepted'} 
					submissionResult={submissionResult}
					activeTab={activeTab}
					setActiveTab={setActiveTab}
				/>
				<Playground 
					problems={problems} 
					setSubmitted={setSubmissionResult} 
					code={code} 
					setCode={setCode} 
					language={language} 
					setLanguage={setLanguage}
				/>
			</Split>
			<div className="md:hidden px-1 flex-grow overflow-hidden flex flex-col">
				<ProblemDesc 
					problems={problems} 
					code={code} 
					language={language} 
					solved={submissionResult?.isAccepted === 'accepted'} 
					submissionResult={submissionResult}
					activeTab={activeTab}
					setActiveTab={setActiveTab}
				/>
				<Playground 
					problems={problems} 
					setSubmitted={setSubmissionResult} 
					code={code} 
					setCode={setCode} 
					language={language} 
					setLanguage={setLanguage}
				/>
			</div>
		</div>
	);
}

export default Workspace

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
	const [submitted, setSubmitted] = useState(false);
	const [language, setLanguage] = useState(languagesData[3]);
	const [code, setCode] = useState(mockComments[language.value]);
	const [clickedProblemId, setClickedProblemId] = useState(null);

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

	return (
		<>
			{submitted && <Confetti gravity={0.3} tweenDuration={5000} />}
			<Split className='split px-1 h-[calc(100vh-10vh)] max-md:hidden overflow-hidden' minSize={500}>
				<ProblemDesc problems={problems} code={code} language={language} />
				<Playground 
					problems={problems} 
					setSubmitted={setSubmitted} 
					code={code} 
					setCode={setCode} 
					language={language} 
					setLanguage={setLanguage}
				/>
			</Split>
			<div className="md:hidden px-1 h-[calc(100vh-10vh)] overflow-hidden flex flex-col">
				<ProblemDesc problems={problems} code={code} language={language} />
				<Playground 
					problems={problems} 
					setSubmitted={setSubmitted} 
					code={code} 
					setCode={setCode} 
					language={language} 
					setLanguage={setLanguage}
				/>
			</div>
		</>
	);
}

export default Workspace

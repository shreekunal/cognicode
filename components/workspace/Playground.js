"use client";
import React, { useEffect, useState } from "react";
import LanguagesDropdown from "../shared/LanguagesDropdown";
import ThemeDropdown from "../shared/ThemeDropdown";
import CodeEditorWindow from "../shared/CodeEditorWindow";
import OutputWindow from "../shared/OutputWindow";
import CustomInput from "../shared/CustomInput";
import CodeReview from "../CodeReview";
import ComplexityAnalysis from "../ComplexityAnalysis";
import Split from "react-split";
import { languagesData, mockComments, getStarterForLanguage } from "@/constants";
import { AiOutlineFullscreen, AiOutlineFullscreenExit } from "react-icons/ai";
import { FiBookOpen, FiCheckCircle, FiAlertTriangle, FiRotateCcw } from "react-icons/fi";
import Timer from "../shared/Timer";
import axios from "axios";
import Loader from "../shared/Loader";
import { useParams } from "next/navigation";
import FontSizeDropdown from "../shared/FontSizeDropdown";

const Playground = ({ problems, isForSubmission = true, setSubmitted }) => {

  const params = useParams();
  const [customInput, setCustomInput] = useState("");
  const [outputDetails, setOutputDetails] = useState(null);
  const [isCodeRunning, setIsCodeRunning] = useState(false);
  const [isCodeSubmitting, setIsCodeSubmitting] = useState(false);
  const [theme, setTheme] = useState({ value: "dark", label: "Dark" });
  const [language, setLanguage] = useState(languagesData[3]);
  const [code, setCode] = useState(mockComments[language.value]);
  const [fontSize, setFontSize] = useState({ value: '14', label: '14px' });
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [clickedProblemId, setClickedProblemId] = useState(null);
  const [activeTab, setActiveTab] = useState("output"); // "output" | "review" | "complexity"
  const [currentProblem, setCurrentProblem] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [explanationLoading, setExplanationLoading] = useState(false);

  // localStorage key for persisting code per problem+language
  const getStorageKey = (problemId, lang) => `cognicode_code_${problemId}_${lang}`;

  useEffect(() => {
    if (problems) {
      const problem = problems.find((p) => p.id === params.id);
      if (problem) {
        setClickedProblemId(problem.id);
        setCurrentProblem(problem);
        if (problem.testCases?.[0]?.input) {
          const input = problem.testCases[0].input;
          setCustomInput(Array.isArray(input) ? input.join('\n') : input);
        }
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
  }, [problems]);

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

  const handleFullScreen = () => {
    if (isFullScreen) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
    setIsFullScreen(!isFullScreen);
  };

  useEffect(() => {
    function exitHandler(e) {
      if (!document.fullscreenElement) {
        setIsFullScreen(false);
        return;
      }
      setIsFullScreen(true);
    }

    document.addEventListener("fullscreenchange", exitHandler);
    document.addEventListener("webkitfullscreenchange", exitHandler);
    document.addEventListener("mozfullscreenchange", exitHandler);
    document.addEventListener("MSFullscreenChange", exitHandler);

    return () => {
      document.removeEventListener("fullscreenchange", exitHandler);
      document.removeEventListener("webkitfullscreenchange", exitHandler);
      document.removeEventListener("mozfullscreenchange", exitHandler);
      document.removeEventListener("MSFullscreenChange", exitHandler);
    };
  }, []);

  // Keyboard shortcuts: Ctrl+Enter to run, Ctrl+Shift+Enter to submit
  useEffect(() => {
    const handleKeyboard = (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) {
          if (isForSubmission && code && !isCodeSubmitting) handleSubmit();
        } else {
          if (code && !isCodeRunning) handleCompile(customInput);
        }
      }
    };
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [code, customInput, isCodeRunning, isCodeSubmitting, isForSubmission]);

  const onChange = (action, data) => {
    switch (action) {
      case "code": {
        setCode(data);
        break;
      }
      default: {
        console.warn("case not handled!", action, data);
      }
    }
  };

  const handleCompile = async (input, forSubmission = false) => {
    if (!forSubmission) setIsCodeRunning(true);

    try {
      // Use Piston API for code execution
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language: language.value,
          code: code,
          input: input,
        }),
      });

      const data = await response.json();

      if (!forSubmission) {
        setOutputDetails(data)
        setIsCodeRunning(false);
      };
      return data.output;
    } catch (error) {
      setIsCodeRunning(false);
      setOutputDetails({ output: 'Execution error: ' + error.message, submitted: false });
    }
  };

  const handleSubmit = async () => {
    setIsCodeSubmitting(true);
    try {
      const res = await fetch("/api/submitCode", {
        method: "POST",
        body: JSON.stringify({ code, problem: clickedProblemId, language: language.value }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();

      if (data.isAccepted === "accepted") {
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 5000);
        setOutputDetails({ output: `Accepted — ${data.passedTestCases}/${data.totalTestCases} test cases passed`, submitted: true, accepted: true });
      } else {
        setOutputDetails({ output: data.output || `Rejected — ${data.passedTestCases}/${data.totalTestCases} test cases passed`, submitted: true, accepted: false });
      }
    } catch (error) {
      setOutputDetails({ output: "Submission failed: " + error.message, submitted: true, accepted: false });
    } finally {
      setIsCodeSubmitting(false);
    }
  }

  const fetchExplanation = async () => {
    if (!currentProblem || !code) return;
    setExplanationLoading(true);
    try {
      const res = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemTitle: currentProblem.title || '',
          problemStatement: (currentProblem.problemStatement || '').replace(/<[^>]*>/g, ''),
          code,
          language: language.value,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setExplanation(data);
      } else {
        setExplanation({ explanation: data.error || 'Failed to get explanation' });
      }
    } catch (e) {
      setExplanation({ explanation: 'Error: ' + e.message });
    } finally {
      setExplanationLoading(false);
    }
  };

  const onLanguageChange = (lang) => {
    const currentDefault = currentProblem?.starterCode
      ? getStarterForLanguage(currentProblem.starterCode, language.value)
      : mockComments[language.value];
    if (code && code !== currentDefault) {
      if (!window.confirm("Switching language will reset your code. Continue?")) return;
    }
    setLanguage(lang);
    // Try to restore saved code for new language first
    const savedCode = clickedProblemId
      ? localStorage.getItem(getStorageKey(clickedProblemId, lang.value))
      : null;
    if (savedCode) {
      setCode(savedCode);
    } else if (currentProblem?.starterCode) {
      setCode(getStarterForLanguage(currentProblem.starterCode, lang.value));
    } else {
      setCode(mockComments[lang.value]);
    }
  };

  const handleResetCode = () => {
    if (!window.confirm("Reset code to starter template? Your changes will be lost.")) return;
    // Clear saved code from localStorage
    if (clickedProblemId) {
      try { localStorage.removeItem(getStorageKey(clickedProblemId, language.value)); } catch (e) { }
    }
    // Reset to starter code or default
    if (currentProblem?.starterCode) {
      setCode(getStarterForLanguage(currentProblem.starterCode, language.value));
    } else {
      setCode(mockComments[language.value]);
    }
  };

  // Shared bottom panel with tabs
  const renderBottomPanel = (additionalStyles = '') => (
    <div className={`!w-full min-h-[30%] flex flex-col pt-3 overflow-y-auto ${additionalStyles}`}>
      <div className="flex justify-between items-center flex-wrap gap-2 flex-shrink-0">
        {/* Tabs */}
        <div className="flex gap-1 bg-light-3 dark:bg-dark-4 rounded-lg p-0.5">
          {[
            { key: "output", label: "Output" },
            { key: "review", label: "AI Review" },
            { key: "complexity", label: "Complexity" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === tab.key
                ? "bg-white dark:bg-dark-2 text-dark-1 dark:text-light-1 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-dark-1 dark:hover:text-light-1"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleCompile(customInput)}
            disabled={!code}
            title="Run (Ctrl+Enter)"
            className="px-4 py-2 bg-dark-4 dark:bg-dark-4 text-light-1 rounded-lg text-sm hover:bg-dark-1 dark:hover:bg-gray-1 transition-colors"
          >
            {isCodeRunning ? <Loader /> : "Run"}
          </button>
          {isForSubmission && (
            <button
              onClick={handleSubmit}
              disabled={!code}
              title="Submit (Ctrl+Shift+Enter)"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-light-1 rounded-lg text-sm transition-colors"
            >
              {isCodeSubmitting ? <Loader /> : "Submit"}
            </button>
          )}
        </div>
      </div>

      <div className="flex-grow mt-2 pb-6 overflow-y-auto">
        {activeTab === "output" && (
          <div className="flex flex-col gap-3">
            <div className="flex gap-5 flex-grow max-xs:flex-col">
              <div className="!w-full flex flex-col">
                <h1 className="font-bold text-lg">Custom Input</h1>
                <CustomInput customInput={customInput} setCustomInput={setCustomInput} />
              </div>
              <OutputWindow outputDetails={outputDetails} additionalStyles={additionalStyles} />
            </div>
            {/* Explain Solution button — shown after accepted submission */}
            {outputDetails?.accepted && (
              <div className="border-t border-light-4 dark:border-dark-4 pt-3">
                {!explanation ? (
                  <button
                    onClick={fetchExplanation}
                    disabled={explanationLoading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:bg-gray-400 transition-colors flex items-center gap-1.5"
                  >
                    <FiBookOpen className="inline" />{explanationLoading ? 'Analyzing...' : 'Explain My Solution'}
                  </button>
                ) : (
                  <div className="space-y-2 text-sm">
                    <h4 className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5"><FiBookOpen /> Solution Explanation</h4>
                    {explanation.explanation && (
                      <p className="text-dark-1 dark:text-light-4">{explanation.explanation}</p>
                    )}
                    {(explanation.timeComplexity || explanation.spaceComplexity) && (
                      <div className="flex gap-3">
                        {explanation.timeComplexity && <span className="px-2 py-1 bg-light-3 dark:bg-dark-4 rounded text-xs">Time: <strong>{explanation.timeComplexity}</strong></span>}
                        {explanation.spaceComplexity && <span className="px-2 py-1 bg-light-3 dark:bg-dark-4 rounded text-xs">Space: <strong>{explanation.spaceComplexity}</strong></span>}
                        {explanation.isOptimal !== undefined && (
                          <span className={`px-2 py-1 rounded text-xs ${explanation.isOptimal ? 'bg-light-3 dark:bg-dark-4 text-green-600 dark:text-green-400' : 'bg-light-3 dark:bg-dark-4 text-yellow-600 dark:text-yellow-400'}`}>
                            {explanation.isOptimal ? <><FiCheckCircle className="inline mr-0.5" />Optimal</> : <><FiAlertTriangle className="inline mr-0.5" />Not optimal</>}
                          </span>
                        )}
                      </div>
                    )}
                    {explanation.optimalApproach && !explanation.isOptimal && (
                      <div className="p-2 bg-light-3 dark:bg-dark-4 rounded">
                        <strong>Optimal approach:</strong> {explanation.optimalApproach}
                      </div>
                    )}
                    {explanation.keyTakeaway && (
                      <div className="p-2 bg-light-3 dark:bg-dark-4 rounded">
                        <strong>Key takeaway:</strong> {explanation.keyTakeaway}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        <div className={activeTab !== "review" ? "hidden" : ""}>
          <CodeReview code={code} language={language.value} autoFetch={activeTab === "review"} />
        </div>
        <div className={activeTab !== "complexity" ? "hidden" : ""}>
          <ComplexityAnalysis code={code} language={language.value} autoFetch={activeTab === "complexity"} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full flex flex-col">
      <div className="flex px-4 gap-2 justify-between max-md:mt-12 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          <LanguagesDropdown onSelectChange={onLanguageChange} />
          <ThemeDropdown handleThemeChange={(th) => setTheme(th)} />
          <FontSizeDropdown onSelectChange={(f) => setFontSize(f)} />
        </div>
        <div className="flex gap-2 items-center">
          <Timer />
          <button onClick={handleResetCode} className="hover:bg-light-3 dark:hover:bg-dark-4 hover:border-light-4 dark:hover:border-dark-3 rounded-lg p-1" title="Reset code (Ctrl+Shift+R)">
            <div className="h-6 w-6 font-bold text-lg text-dark-4 dark:text-light-4">
              <FiRotateCcw />
            </div>
          </button>
          <button onClick={handleFullScreen} className="hover:bg-light-3 dark:hover:bg-dark-4 hover:border-light-4 dark:hover:border-dark-3 rounded-lg p-1">
            <div className="h-6 w-6 font-bold text-2xl text-dark-4 dark:text-light-4">
              {!isFullScreen ? (
                <AiOutlineFullscreen />
              ) : (
                <AiOutlineFullscreenExit />
              )}
            </div>
          </button>
        </div>
      </div>

      <Split
        className="!w-full flex-grow flex flex-col items-start px-4 pt-4 pb-4 max-md:hidden"
        direction="vertical"
        minSize={100}
      >
        <CodeEditorWindow
          code={code}
          onChange={onChange}
          language={language.value}
          theme={theme.value}
          fontSize={fontSize.value}
        />
        {renderBottomPanel()}
      </Split>

      <div className="!w-full flex-grow flex flex-col items-start px-4 pt-4 pb-4 md:hidden max-md:w-[500px]">
        <CodeEditorWindow
          code={code}
          onChange={onChange}
          language={language.value}
          theme={theme.value}
          fontSize={fontSize.value}
        />
        {renderBottomPanel('max-md:min-h-[300px]')}
      </div>
    </div>
  );
};

export default Playground;

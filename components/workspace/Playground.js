"use client";
import React, { useEffect, useRef, useState } from "react";
import Split from "react-split";
import CodeEditorWindow from "../shared/CodeEditorWindow";
import OutputWindow from "../shared/OutputWindow";
import CodeReview from "../CodeReview";
import ComplexityAnalysis from "../ComplexityAnalysis";
import { languagesData, mockComments, getStarterForLanguage } from "@/constants";
import { FiBookOpen, FiCheckCircle, FiAlertTriangle, FiRotateCcw, FiHelpCircle, FiCompass, FiTarget, FiCode, FiDownload, FiMaximize, FiMinimize, FiSettings } from "react-icons/fi";
import { BsLightbulb } from "react-icons/bs";
import Timer from "../shared/Timer";
import axios from "axios";
import Loader from "../shared/Loader";
import { useParams } from "next/navigation";

const Playground = ({ problems, isForSubmission = true, setSubmitted, code, setCode, language, setLanguage }) => {

  const defaultEditorSettings = {
    fontStyle: "mono",
    showLineNumbers: true,
    superAlarm: false,
  };

  const fontStyleOptions = [
    { value: "mono", label: "Monospace", family: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace' },
    { value: "clean", label: "Clean", family: 'Poppins, sans-serif' },
    { value: "serif", label: "Serif", family: 'Georgia, serif' },
  ];

  const languageOptions = languagesData;
  const themeOptions = [
    { label: 'Dark', value: 'dark' },
    { label: 'Light', value: 'light' },
  ];
  const fontSizeOptions = [
    { label: '10', value: '10' },
    { label: '12', value: '12' },
    { label: '14', value: '14' },
    { label: '16', value: '16' },
    { label: '18', value: '18' },
    { label: '20', value: '20' },
  ];

  const params = useParams();
  const [outputDetails, setOutputDetails] = useState(null);
  const [isCodeRunning, setIsCodeRunning] = useState(false);
  const [isCodeSubmitting, setIsCodeSubmitting] = useState(false);
  const [theme, setTheme] = useState(themeOptions[0]);
  const [fontSize, setFontSize] = useState({ value: '14', label: '14px' });
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [clickedProblemId, setClickedProblemId] = useState(null);
  const [activeTab, setActiveTab] = useState("testcases"); // "results" | "hint" | "testcases"
  const [currentProblem, setCurrentProblem] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [selectedTestCaseIndex, setSelectedTestCaseIndex] = useState(0);

  // Custom Input State
  const [isCustomInput, setIsCustomInput] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [testCaseResults, setTestCaseResults] = useState([]); // Array of { status: 'passed' | 'failed' | 'error', actualOutput: string }

  // Hint State
  const [hintLevel, setHintLevel] = useState(0);
  const [hints, setHints] = useState([]);
  const [hintLoading, setHintLoading] = useState(false);
  const [hintError, setHintError] = useState(null);
  const [hintOpenLevel, setHintOpenLevel] = useState(null);

  const [editorSettings, setEditorSettings] = useState(defaultEditorSettings);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState("language");
  const settingsRef = useRef(null);

  const [lastCodeLoading, setLastCodeLoading] = useState(false);

  const activeFontStyle = fontStyleOptions.find((option) => option.value === editorSettings.fontStyle) || fontStyleOptions[0];

  const retrieveLastSubmission = async () => {
    if (!clickedProblemId) return;
    setLastCodeLoading(true);
    try {
      const res = await fetch(`/api/getSubmissions?problemId=${clickedProblemId}`);
      const data = await res.json();
      if (data.ok && data.submissions?.length > 0) {
        const lastSub = data.submissions[0];
        if (lastSub.code) {
          if (window.confirm("This will replace your current code with the last submission. Continue?")) {
            setCode(lastSub.code);
          }
        } else {
          alert("No code found in the last submission.");
        }
      } else {
        alert("No previous submissions found for this problem.");
      }
    } catch (e) {
      alert("Failed to retrieve last submission: " + e.message);
    } finally {
      setLastCodeLoading(false);
    }
  };

  const formatCode = () => {
    try {
      let indentLevel = 0;
      const lines = code.split('\n');
      const formattedLines = lines.map(line => {
        let trimmed = line.trim();
        if (!trimmed) return "";
        const closingMatches = (trimmed.match(/[}\]\]]/g) || []).length;
        const openingMatches = (trimmed.match(/[{(\[]/g) || []).length;
        if (/^[}\])\s]/.test(trimmed)) {
          indentLevel = Math.max(0, indentLevel - 1);
        }
        const indent = "  ".repeat(indentLevel);
        if (openingMatches > closingMatches) {
          indentLevel += (openingMatches - closingMatches);
        } else if (closingMatches > openingMatches) {
          indentLevel = Math.max(0, indentLevel - (closingMatches - openingMatches));
        }
        return indent + trimmed;
      });
      setCode(formattedLines.join('\n'));
    } catch (e) {
      console.error("Formatting failed", e);
    }
  };

  const toggleHint = async (level) => {
    if (hintOpenLevel === level) {
      setHintOpenLevel(null);
      return;
    }
    if (level > hintLevel) {
      await fetchHint();
    }
    setHintOpenLevel(level);
  };

  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem("cognicode_editor_settings");
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setEditorSettings((currentSettings) => ({
          ...currentSettings,
          ...parsedSettings,
        }));
      }
    } catch (error) { }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("cognicode_editor_settings", JSON.stringify(editorSettings));
    } catch (error) { }
  }, [editorSettings]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const fetchHint = async () => {
    if (hintLevel >= 3 || !currentProblem) return;
    const nextLevel = hintLevel + 1;
    setHintLoading(true);
    setHintError(null);
    try {
      const res = await fetch('/api/ai/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemTitle: currentProblem.title || '',
          problemStatement: (currentProblem.problemStatement || '').replace(/<[^>]*>/g, ''),
          difficulty: currentProblem.difficulty || 'Medium',
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

  const formatCaseValue = (value) => Array.isArray(value) ? value.join('\n') : (value || '');
  const visibleTestCases = currentProblem?.testCases?.slice(0, 3) || [];
  const selectedTestCase = visibleTestCases[selectedTestCaseIndex] || visibleTestCases[0] || null;
  const selectedTestCaseInput = formatCaseValue(selectedTestCase?.input);

  useEffect(() => {
    if (problems) {
      const problem = problems.find((p) => p.id === params.id);
      if (problem) {
        setClickedProblemId(problem.id);
        setCurrentProblem(problem);
        setSelectedTestCaseIndex(0);
        setActiveTab("testcases");
        setOutputDetails(null);
        setExplanation(null);
        setExplanationLoading(false);
        setHints([]);
        setHintLevel(0);
        setHintError(null);
        setHintOpenLevel(null);
        setTestCaseResults([]);
      }
    }
  }, [problems, params.id]);

  const handleFullScreen = () => {
    if (isFullScreen) document.exitFullscreen();
    else document.documentElement.requestFullscreen();
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

  useEffect(() => {
    const handleKeyboard = (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) {
          if (isForSubmission && code && !isCodeSubmitting) handleSubmit();
        } else {
          if (code && !isCodeRunning) handleCompile();
        }
      }
    };
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [code, selectedTestCaseInput, isCodeRunning, isCodeSubmitting, isForSubmission]);

  const onChange = (action, data) => {
    if (action === "code") setCode(data);
  };

  const handleCompile = async (input = null, runAll = false) => {
    setIsCodeRunning(true);
    setActiveTab("results");

    if (runAll && !isCustomInput) {
      const newResults = [...testCaseResults];
      for (let i = 0; i < visibleTestCases.length; i++) {
        const testCase = visibleTestCases[i];
        const tcInput = formatCaseValue(testCase.input);
        try {
          const response = await fetch('/api/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language: language.value, code: code, input: tcInput }),
          });
          const data = await response.json();
          const actualOutput = (data.output || "").trim();
          const expectedOutput = formatCaseValue(testCase.output).trim();
          const isPassed = actualOutput === expectedOutput;

          newResults[i] = { status: isPassed ? 'passed' : 'failed', actualOutput: actualOutput };
          if (i === selectedTestCaseIndex) setOutputDetails(data);
        } catch (error) {
          newResults[i] = { status: 'error', actualOutput: error.message };
        }
      }
      setTestCaseResults(newResults);
      setIsCodeRunning(false);
      return;
    }

    const runInput = input !== null ? input : (isCustomInput ? customInput : selectedTestCaseInput);

    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: language.value, code: code, input: runInput }),
      });
      const data = await response.json();
      setOutputDetails(data);

      if (!isCustomInput && selectedTestCase) {
        const actualOutput = (data.output || "").trim();
        const expectedOutput = formatCaseValue(selectedTestCase.output).trim();
        const isPassed = actualOutput === expectedOutput;

        setTestCaseResults(prev => {
          const res = [...prev];
          res[selectedTestCaseIndex] = { status: isPassed ? 'passed' : 'failed', actualOutput: actualOutput };
          return res;
        });
      }
      setIsCodeRunning(false);
    } catch (error) {
      setIsCodeRunning(false);
      setOutputDetails({ output: 'Execution error: ' + error.message, submitted: false });
    }
  };

  const handleSubmit = async () => {
    setIsCodeSubmitting(true);
    setActiveTab("results");
    try {
      const res = await fetch("/api/submitCode", {
        method: "POST",
        body: JSON.stringify({ code, problem: clickedProblemId, language: language.value }),
        headers: { "Content-Type": "application/json" },
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
      if (data.ok) setExplanation(data);
      else setExplanation({ explanation: data.error || 'Failed to get explanation' });
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
  };

  const handleResetCode = () => {
    if (!window.confirm("Reset code to starter template? Your changes will be lost.")) return;
    if (currentProblem?.starterCode) setCode(getStarterForLanguage(currentProblem.starterCode, language.value));
    else setCode(mockComments[language.value]);
  };

  const toggleLineNumbers = () => setEditorSettings((s) => ({ ...s, showLineNumbers: !s.showLineNumbers }));
  const toggleSuperAlarm = () => setEditorSettings((s) => ({ ...s, superAlarm: !s.superAlarm }));
  const setFontStyle = (f) => setEditorSettings((s) => ({ ...s, fontStyle: f }));

  const renderBottomPanel = (additionalStyles = '') => {
    return (
      <div className={`w-full h-full overflow-y-auto space-y-3 pb-10 ${additionalStyles}`}>
        {activeTab === "testcases" && (
          <div className="rounded-2xl border border-light-4 dark:border-dark-4 bg-light-2 dark:bg-dark-3 shadow-sm overflow-hidden">
            <div className="flex gap-2 overflow-x-auto px-4 py-3 border-b border-light-4 dark:border-dark-4 bg-light-3/30 dark:bg-dark-4/20">
              {visibleTestCases.map((testCase, index) => {
                const isActive = index === selectedTestCaseIndex && !isCustomInput;
                const result = testCaseResults[index];
                return (
                  <button
                    key={`${currentProblem?.id || 'case'}-${index}`}
                    onClick={() => {
                      setSelectedTestCaseIndex(index);
                      setIsCustomInput(false);
                    }}
                    className={`shrink-0 rounded-full px-4 py-1.5 text-[11px] font-semibold transition-all border flex items-center gap-1.5 ${isActive
                      ? 'bg-red-600 text-white border-red-600 shadow-sm'
                      : 'bg-light-3 dark:bg-dark-4 text-gray-600 dark:text-gray-300 border-transparent hover:border-light-4 dark:hover:border-dark-3'
                      }`}
                  >
                    {result?.status === 'passed' && <FiCheckCircle size={12} className="text-green-400" />}
                    {result?.status === 'failed' && <FiAlertTriangle size={12} className="text-red-400" />}
                    Case {index + 1}
                  </button>
                );
              })}
              <div className="h-6 w-[1px] bg-light-4 dark:bg-dark-4 mx-1" />
              <button
                onClick={() => setIsCustomInput(true)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-[11px] font-semibold transition-all border ${isCustomInput
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-light-3 dark:bg-dark-4 text-gray-600 dark:text-gray-300 border-transparent hover:border-light-4 dark:hover:border-dark-3'
                  }`}
              >
                Custom Input
              </button>
              {!isCustomInput && visibleTestCases.length > 0 && (
                <button
                  onClick={() => handleCompile(null, true)}
                  disabled={isCodeRunning}
                  className="shrink-0 rounded-full px-4 py-1.5 text-[11px] font-bold transition-all border bg-green-600 text-white border-green-600 hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-1.5 shadow-sm ml-auto"
                >
                  {isCodeRunning ? <Loader /> : <><FiCheckCircle size={12} /> Run All</>}
                </button>
              )}
            </div>

            {isCustomInput ? (
              <div className="px-4 py-4">
                <div className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2 font-bold">Your Input</div>
                <textarea
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="Enter custom input here..."
                  className="w-full h-32 p-3 rounded-xl border border-light-4 dark:border-dark-4 bg-white dark:bg-dark-2 font-mono text-xs text-dark-1 dark:text-light-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            ) : selectedTestCase ? (
              <div className="grid gap-3 px-4 py-4 md:grid-cols-2">
                <div className="rounded-xl border border-light-4 dark:border-dark-4 bg-white dark:bg-dark-2 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2 font-bold">Input</div>
                  <pre className="whitespace-pre-wrap font-mono text-xs text-dark-1 dark:text-light-1 leading-5 overflow-auto max-h-28">{selectedTestCaseInput || 'No input available'}</pre>
                </div>
                <div className="rounded-xl border border-light-4 dark:border-dark-4 bg-white dark:bg-dark-2 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2 font-bold">Expected output</div>
                  <pre className="whitespace-pre-wrap font-mono text-xs text-dark-1 dark:text-light-1 leading-5 overflow-auto max-h-28">{formatCaseValue(selectedTestCase.output) || 'No output available'}</pre>
                </div>
              </div>
            ) : (
              <div className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">No test cases available.</div>
            )}
          </div>
        )}

        {activeTab === "results" && (
          <div className="flex flex-col gap-3">
            <OutputWindow outputDetails={outputDetails} additionalStyles={additionalStyles} />

            {outputDetails?.accepted && (
              <div className="border-t border-light-4 dark:border-dark-4 pt-3">
                {!explanation ? (
                  <button
                    onClick={fetchExplanation}
                    disabled={explanationLoading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:bg-gray-400 transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <FiBookOpen className="inline" />{explanationLoading ? 'Analyzing...' : 'Explain My Solution'}
                  </button>
                ) : (
                  <div className="space-y-2 text-sm p-1">
                    <h4 className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5"><FiBookOpen /> Solution Explanation</h4>
                    {explanation.explanation && (
                      <p className="text-dark-1 dark:text-light-4 leading-relaxed">{explanation.explanation}</p>
                    )}
                    {(explanation.timeComplexity || explanation.spaceComplexity) && (
                      <div className="flex gap-3 flex-wrap mt-2">
                        {explanation.timeComplexity && <span className="px-2 py-1 bg-light-3 dark:bg-dark-4 rounded text-[10px] font-bold">TIME: {explanation.timeComplexity}</span>}
                        {explanation.spaceComplexity && <span className="px-2 py-1 bg-light-3 dark:bg-dark-4 rounded text-[10px] font-bold">SPACE: {explanation.spaceComplexity}</span>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "hint" && (
          <div className="flex flex-col gap-3 max-w-2xl px-1 mt-1">
            <div className="space-y-2">
              {[1, 2, 3].map((l) => {
                const isGenerating = hintLoading && l === hintLevel + 1;
                const isAvailable = l <= hintLevel;
                const isNext = l === hintLevel + 1;
                return (
                  <div key={l} className="rounded-xl border border-light-4 dark:border-dark-4 overflow-hidden shadow-sm">
                    <button
                      onClick={() => toggleHint(l)}
                      disabled={l > hintLevel + 1 || (hintLoading && !isGenerating && !isAvailable)}
                      className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${!isAvailable && !isNext
                        ? 'bg-light-3/50 dark:bg-dark-4/30 opacity-50 cursor-not-allowed text-gray-400'
                        : 'bg-light-2 dark:bg-dark-3 hover:bg-light-3 dark:hover:bg-dark-4'}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={isAvailable ? 'text-red-500' : 'text-gray-400'}>
                          {isGenerating ? <div className="animate-spin h-3 w-3 border-2 border-red-500 border-t-transparent rounded-full" /> : hintIcons[l - 1]}
                        </span>
                        <span className="text-sm font-semibold text-dark-1 dark:text-light-1">
                          {hintLabels[l - 1]}
                          {isGenerating && <span className="ml-2 text-[10px] font-normal text-gray-400 animate-pulse">Generating...</span>}
                        </span>
                      </div>
                      <FiMaximize size={12} className={`text-gray-400 transform transition-transform duration-300 ${hintOpenLevel === l ? 'rotate-180' : ''}`} />
                    </button>
                    {hintOpenLevel === l && isAvailable && (
                      <div className="p-4 bg-white dark:bg-dark-2 border-t border-light-4 dark:border-dark-4 animate-slide-down">
                        <p className="text-sm leading-relaxed text-dark-1 dark:text-light-2 italic">
                          {hints.find(h => h.level === l)?.text}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {hintError && (
              <div className="text-xs text-red-500 mt-2 font-medium bg-red-50 dark:bg-red-900/10 p-2 rounded border border-red-200 dark:border-red-800">{hintError}</div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderBottomStrip = () => (
    <div className="absolute inset-x-0 bottom-0 z-20 px-2 pb-1">
      <div className="h-8 w-full rounded-md border border-light-4 dark:border-dark-4 bg-light-2/95 dark:bg-dark-3/95 px-2 text-[12px] flex items-center gap-2 shadow-sm backdrop-blur-sm">
        <button
          onClick={() => setActiveTab('hint')}
          className={`flex items-center gap-1 transition-colors ${activeTab === 'hint'
            ? 'text-green-600 dark:text-green-400'
            : 'text-gray-500 dark:text-gray-400 hover:text-dark-1 dark:hover:text-light-2'}`}
        >
          <FiHelpCircle size={12} />
          Hint
        </button>
        <span className="text-gray-400">&gt;</span>
        <button
          onClick={() => setActiveTab('testcases')}
          className={`flex items-center gap-1 transition-colors ${activeTab === 'testcases'
            ? 'text-green-600 dark:text-green-400'
            : 'text-gray-500 dark:text-gray-400 hover:text-dark-1 dark:hover:text-light-2'}`}
        >
          <FiTarget size={12} />
          Test Cases
        </button>
        <span className="text-gray-400">&gt;</span>
        <button
          onClick={() => setActiveTab('results')}
          className={`flex items-center gap-1 transition-colors ${activeTab === 'results'
            ? 'text-green-600 dark:text-green-400'
            : 'text-gray-500 dark:text-gray-400 hover:text-dark-1 dark:hover:text-light-2'}`}
        >
          <FiCheckCircle size={12} />
          Test Result
        </button>
        <div className="flex-grow" />
        <button
          onClick={() => setActiveTab(activeTab ? null : 'testcases')}
          className="text-gray-400 hover:text-dark-1 dark:hover:text-light-2"
        >
          {activeTab ? <FiMinimize size={14} className="rotate-45" /> : <FiMaximize size={14} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full h-full min-h-0 flex flex-col overflow-hidden">
      <div className="flex px-1 py-1 gap-2 justify-between max-md:mt-2 flex-wrap bg-light-2 dark:bg-dark-3 border-b border-light-4 dark:border-dark-4">
        <div className="flex gap-1.5 items-center">
          <div className="flex items-center gap-1">
            <button onClick={formatCode} className="hover:bg-light-3 dark:hover:bg-dark-4 rounded-md p-1 transition-colors text-dark-4 dark:text-light-4" title="Format Code">
              <FiCode size={16} />
            </button>
            <button onClick={retrieveLastSubmission} disabled={lastCodeLoading} className="hover:bg-light-3 dark:hover:bg-dark-4 rounded-md p-1 transition-colors text-dark-4 dark:text-light-4 disabled:opacity-50" title="Retrieve Last Submission">
              {lastCodeLoading ? <Loader /> : <FiDownload size={16} />}
            </button>
          </div>
          <div className="h-4 w-[1px] bg-light-4 dark:bg-dark-4 mx-1" />
          <Timer superAlarmEnabled={editorSettings.superAlarm} />
        </div>
        <div className="flex gap-2 items-center">
          <button onClick={handleResetCode} className="hover:bg-light-3 dark:hover:bg-dark-4 rounded-md p-1 transition-colors text-dark-4 dark:text-light-4" title="Reset code (Ctrl+Shift+R)">
            <FiRotateCcw size={16} />
          </button>
          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setSettingsOpen((open) => !open)}
              className="hover:bg-light-3 dark:hover:bg-dark-4 rounded-md p-1 transition-colors text-dark-4 dark:text-light-4"
              title="Editor settings"
            >
              <FiSettings size={16} />
            </button>
            {settingsOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm" onClick={() => setSettingsOpen(false)}>
                <div
                  className="flex h-[74vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-light-4 bg-light-1 shadow-[0_30px_90px_rgba(0,0,0,0.45)] dark:border-dark-4 dark:bg-dark-2"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="w-[220px] shrink-0 border-r border-light-4 bg-light-2 p-4 dark:border-dark-4 dark:bg-dark-3">
                    <div className="space-y-2">
                      {[
                        { key: "language", label: "Language" },
                        { key: "theme", label: "Theme" },
                        { key: "font-size", label: "Font" },
                        { key: "code-editor", label: "Code Editor" },
                        { key: "timer", label: "Timer" },
                      ].map((item) => (
                        <button
                          key={item.key}
                          onClick={() => setSettingsSection(item.key)}
                          className={`w-full rounded-lg px-4 py-3 text-left text-sm transition-colors ${settingsSection === item.key
                            ? 'bg-dark-4 text-white dark:bg-light-4 dark:text-dark-1'
                            : 'text-gray-500 hover:bg-light-3 hover:text-dark-1 dark:text-gray-400 dark:hover:bg-dark-4 dark:hover:text-light-1'
                            }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-center justify-between border-b border-light-4 px-5 py-4 dark:border-dark-4">
                      <div>
                        <div className="text-sm font-semibold text-dark-1 dark:text-light-1">Settings</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Make it yours with your controls</div>
                      </div>
                      <button
                        onClick={() => setSettingsOpen(false)}
                        className="rounded-md p-2 text-gray-500 transition-colors hover:bg-light-3 hover:text-dark-1 dark:hover:bg-dark-4 dark:hover:text-light-1"
                        title="Close settings"
                      >
                        <FiMinimize size={14} className="rotate-45" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5">
                      {settingsSection === "language" && (
                        <div className="space-y-2">
                          {languageOptions.map((option) => {
                            const isSelected = language.value === option.value;
                            return (
                              <button
                                key={option.value}
                                onClick={() => onLanguageChange(option)}
                                className={`w-full flex items-center justify-between rounded-lg px-4 py-3 text-sm transition-colors ${isSelected
                                  ? 'bg-light-3 text-dark-1 dark:bg-dark-4 dark:text-light-1'
                                  : 'text-gray-500 hover:bg-light-3 hover:text-dark-1 dark:text-gray-400 dark:hover:bg-dark-4 dark:hover:text-light-1'
                                  }`}
                              >
                                <span>{option.label}</span>
                                <span className={`h-2.5 w-2.5 rounded-full ${isSelected ? 'bg-red-500' : 'border border-gray-400/70'}`} />
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {settingsSection === "theme" && (
                        <div className="space-y-2">
                          {themeOptions.map((option) => {
                            const isSelected = theme.value === option.value;
                            return (
                              <button
                                key={option.value}
                                onClick={() => setTheme(option)}
                                className={`w-full flex items-center justify-between rounded-lg px-4 py-3 text-sm transition-colors ${isSelected
                                  ? 'bg-light-3 text-dark-1 dark:bg-dark-4 dark:text-light-1'
                                  : 'text-gray-500 hover:bg-light-3 hover:text-dark-1 dark:text-gray-400 dark:hover:bg-dark-4 dark:hover:text-light-1'
                                  }`}
                              >
                                <span>{option.label}</span>
                                <span className={`h-2.5 w-2.5 rounded-full ${isSelected ? 'bg-red-500' : 'border border-gray-400/70'}`} />
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {settingsSection === "font-size" && (
                        <div className="space-y-2">
                          {fontSizeOptions.map((option) => {
                            const isSelected = String(fontSize.value) === option.value;
                            return (
                              <button
                                key={option.value}
                                onClick={() => setFontSize({ value: option.value, label: option.label })}
                                className={`w-full flex items-center justify-between rounded-lg px-4 py-3 text-sm transition-colors ${isSelected
                                  ? 'bg-light-3 text-dark-1 dark:bg-dark-4 dark:text-light-1'
                                  : 'text-gray-500 hover:bg-light-3 hover:text-dark-1 dark:text-gray-400 dark:hover:bg-dark-4 dark:hover:text-light-1'
                                  }`}
                              >
                                <span>{option.label}px</span>
                                <span className={`h-2.5 w-2.5 rounded-full ${isSelected ? 'bg-red-500' : 'border border-gray-400/70'}`} />
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {settingsSection === "code-editor" && (
                        <div className="space-y-2">
                          {fontStyleOptions.map((option) => {
                            const isSelected = editorSettings.fontStyle === option.value;
                            return (
                              <button
                                key={option.value}
                                onClick={() => setFontStyle(option.value)}
                                className={`w-full flex items-center justify-between rounded-lg px-4 py-3 text-sm transition-colors ${isSelected
                                  ? 'bg-light-3 text-dark-1 dark:bg-dark-4 dark:text-light-1'
                                  : 'text-gray-500 hover:bg-light-3 hover:text-dark-1 dark:text-gray-400 dark:hover:bg-dark-4 dark:hover:text-light-1'
                                  }`}
                              >
                                <span>{option.label}</span>
                                <span className={`h-2.5 w-2.5 rounded-full ${isSelected ? 'bg-red-500' : 'border border-gray-400/70'}`} />
                              </button>
                            );
                          })}
                          <button onClick={toggleLineNumbers} className="w-full flex items-center justify-between rounded-lg px-4 py-3 text-sm text-dark-1 transition-colors hover:bg-light-3 dark:text-light-1 dark:hover:bg-dark-4">
                            <span>Line Numbers</span>
                            <span className={`text-xs font-semibold ${editorSettings.showLineNumbers ? 'text-green-500' : 'text-gray-500'}`}>{editorSettings.showLineNumbers ? 'On' : 'Off'}</span>
                          </button>
                        </div>
                      )}

                      {settingsSection === "timer" && (
                        <div className="space-y-2">
                          <button onClick={toggleSuperAlarm} className="w-full flex items-start justify-between rounded-lg px-4 py-3 text-left text-sm text-dark-1 transition-colors hover:bg-light-3 dark:text-light-1 dark:hover:bg-dark-4">
                            <span className="pr-4">
                              <span className="block font-medium">Super Alarm</span>
                              <span className="mt-1 block text-xs leading-4 text-gray-500 dark:text-gray-400">Plays a sound at 10 minutes remaining and again when the timer ends.</span>
                            </span>
                            <span className={`text-xs font-semibold whitespace-nowrap ${editorSettings.superAlarm ? 'text-green-500' : 'text-gray-500'}`}>{editorSettings.superAlarm ? 'On' : 'Off'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <button onClick={handleFullScreen} className="hover:bg-light-3 dark:hover:bg-dark-4 rounded-md p-1 transition-colors text-dark-4 dark:text-light-4">
            {!isFullScreen ? <FiMaximize size={16} /> : <FiMinimize size={16} />}
          </button>
          <button
            onClick={() => handleCompile()}
            disabled={!code}
            title="Run (Ctrl+Enter)"
            className="px-3 py-1 bg-dark-4 dark:bg-dark-4 text-white rounded-md text-xs hover:bg-dark-1 dark:hover:bg-gray-1 transition-colors flex items-center justify-center min-w-[50px]"
          >
            {isCodeRunning ? <Loader /> : "Run"}
          </button>
          {isForSubmission && (
            <button
              onClick={handleSubmit}
              disabled={!code}
              title="Submit (Ctrl+Shift+Enter)"
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs transition-colors flex items-center justify-center min-w-[60px]"
            >
              {isCodeSubmitting ? <Loader /> : "Submit"}
            </button>
          )}
        </div>
      </div>
      <div className="w-full flex-grow min-h-0 px-1 pt-1 pb-4 max-md:hidden overflow-hidden">
        <Split
          direction="vertical"
          sizes={activeTab ? [60, 40] : [100, 0]}
          minSize={activeTab ? [100, 200] : [0, 0]}
          gutterSize={activeTab ? 8 : 0}
          className="h-full w-full"
        >
          <div className="h-full w-full min-h-0">
            <CodeEditorWindow code={code} onChange={onChange} language={language.value} theme={theme.value} fontSize={fontSize.value} fontFamily={activeFontStyle.family} showLineNumbers={editorSettings.showLineNumbers} />
          </div>
          <div className={`h-full w-full min-h-0 overflow-hidden relative ${!activeTab ? 'hidden' : ''}`}>
            <div className="h-full w-full rounded-t-2xl border border-light-4 dark:border-dark-4 bg-light-1/98 dark:bg-dark-2/98 p-2 shadow-[0_-8px_24px_rgba(0,0,0,0.18)] backdrop-blur-sm overflow-hidden">
              {renderBottomPanel()}
            </div>
            {renderBottomStrip()}
          </div>
        </Split>
      </div>
      <div className="w-full flex-grow min-h-0 px-1 pt-1 pb-4 md:hidden overflow-hidden flex flex-col">
        <div className="flex-grow relative min-h-[300px]">
          <CodeEditorWindow code={code} onChange={onChange} language={language.value} theme={theme.value} fontSize={fontSize.value} fontFamily={activeFontStyle.family} showLineNumbers={editorSettings.showLineNumbers} />
        </div>
        <div className={`relative transition-all duration-300 overflow-hidden ${activeTab ? 'h-[350px]' : 'h-10'}`}>
          <div className="h-full w-full rounded-t-2xl border border-light-4 dark:border-dark-4 bg-light-1/98 dark:bg-dark-2/98 p-2 shadow-[0_-8px_24px_rgba(0,0,0,0.18)] backdrop-blur-sm overflow-hidden">
            {activeTab && renderBottomPanel('max-md:pb-2')}
          </div>
          {renderBottomStrip()}
        </div>
      </div>
    </div>
  );
};

export default Playground;

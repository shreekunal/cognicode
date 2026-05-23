import React from "react";

const OutputWindow = ({ outputDetails, additionalStyles, theme = "dark", isLoading = false }) => {
  const isLightTheme = theme === "light";
  const cpuTime = outputDetails?.cpuTime !== undefined && outputDetails?.cpuTime !== null
    ? `${Math.round(outputDetails.cpuTime * 1000)} ms`
    : null;
  const memory = outputDetails?.memory !== undefined && outputDetails?.memory !== null
    ? `${outputDetails.memory}b`
    : null;
  const runtime = outputDetails?.resultRuntime || cpuTime || "0 ms";
  const title = outputDetails?.resultTitle || (outputDetails?.submitted ? (outputDetails.accepted ? "Accepted" : "Rejected") : "Output");
  const hasCaseDetails = Boolean(outputDetails?.caseInput);
  const compileErrorText = outputDetails?.error && !outputDetails?.caseInput
    ? outputDetails.error
    : null;

  const statusClass = outputDetails?.resultStatus === "accepted"
    ? "text-green-500"
    : outputDetails?.resultStatus === "wrong-answer"
      ? "text-red-500"
      : outputDetails?.resultStatus === "compilation-error" || outputDetails?.resultStatus === "execution-error"
        ? "text-orange-400"
        : "text-red-500";

  const panelClass = isLightTheme ? "bg-white text-dark-1 border border-light-4" : "bg-dark-2 text-white border border-dark-4";
  const subtleTextClass = isLightTheme ? "text-gray-500" : "text-gray-400";
  const runtimeTextClass = isLightTheme ? "text-gray-700" : "text-gray-300";

  const renderCodeBlock = (value, tone = isLightTheme ? "text-dark-1" : "text-white") => {
    // Match the Test Cases layout used in Playground.js
    const codeBaseClass = `whitespace-pre-wrap font-mono text-[12px] leading-5 overflow-auto max-h-24 bg-transparent rounded-none shadow-none p-0 ${isLightTheme ? 'text-dark-1' : 'text-white'}`;

    if (value === null || value === undefined) {
      return (
        <div className={`${codeBaseClass} text-gray-500 italic`}>No output available</div>
      );
    }

    if (value === "") {
      return (
        <div className={`${codeBaseClass} text-gray-500 italic`}>(Execution successful — no output)</div>
      );
    }

    return (
      <div className={`${codeBaseClass} ${tone}`}>{value}</div>
    );
  };

  return (
    <div className={`!w-full flex-1 min-h-0 flex flex-col ${additionalStyles}`}>
      {isLoading ? (
        <div className={`w-full flex-1 min-h-0 flex items-center justify-center rounded-md border ${panelClass}`}>
          <div className="flex flex-col items-center gap-3 px-4 py-6 text-center">
            <div className={`h-8 w-8 animate-spin rounded-full border-2 border-t-transparent ${isLightTheme ? 'border-gray-400' : 'border-gray-200'}`} />
            <div>
              <div className="text-sm font-semibold">Loading test results</div>
              <div className={`mt-1 text-xs ${subtleTextClass}`}>Please wait while the code is being executed.</div>
            </div>
          </div>
        </div>
      ) : !outputDetails ? (
        <div className={`w-full flex-1 min-h-0 rounded-md ${panelClass}`} />
      ) : outputDetails.submitted ? (
        <div className={`w-full flex-1 min-h-0 flex flex-col gap-1 rounded-md p-2 overflow-y-auto ${panelClass}`}>
          <div className="flex items-baseline gap-2 flex-wrap">
            <h4 className={`text-xl font-bold ${outputDetails.accepted ? "text-green-500" : "text-red-500"}`}>
              {outputDetails.accepted ? "Accepted" : "Wrong Answer"}
            </h4>
            <span className={`text-[11px] ${runtimeTextClass}`}>Runtime: {runtime}</span>
          </div>

          {hasCaseDetails && (
            <div className="space-y-2">
              <div className="grid gap-2 md:grid-cols-2 items-stretch auto-rows-fr">
                <div className="h-full flex flex-col">
                  <div className="flex-1">
                    <div className={`rounded-lg border p-3 ${isLightTheme ? 'border-light-4 bg-white text-dark-1' : 'border-dark-4 bg-dark-3 text-white'}`}>
                      <div className={`mb-1 text-[12px] uppercase font-bold tracking-tight ${isLightTheme ? 'text-gray-500' : 'text-gray-200'}`}>Input</div>
                      {renderCodeBlock(outputDetails.caseInput)}
                    </div>
                  </div>
                </div>
                <div className="h-full flex flex-col">
                  <div className="flex-1">
                    <div className={`rounded-lg border p-3 ${isLightTheme ? 'border-light-4 bg-white text-dark-1' : 'border-dark-4 bg-dark-3 text-white'}`}>
                      <div className={`mb-1 text-[12px] uppercase font-bold tracking-tight ${isLightTheme ? 'text-gray-500' : 'text-gray-200'}`}>Output</div>
                      {renderCodeBlock(
                        outputDetails.caseOutput ?? outputDetails.output,
                        outputDetails.accepted
                          ? (isLightTheme ? "text-green-700" : "text-green-300")
                          : (isLightTheme ? "text-red-700" : "text-red-300")
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className={`rounded-lg border p-3 ${isLightTheme ? 'border-light-4 bg-white text-dark-1' : 'border-dark-4 bg-dark-3 text-white'}`}>
                  <div className={`mb-1 text-[12px] uppercase font-bold tracking-tight ${isLightTheme ? 'text-gray-500' : 'text-gray-200'}`}>Expected</div>
                  {renderCodeBlock(outputDetails.caseExpected, isLightTheme ? "text-green-700" : "text-green-300")}
                </div>
              </div>
            </div>
          )}

          {!outputDetails.accepted && !hasCaseDetails && (
            <div>
              <div className={`mb-0.5 text-[12px] uppercase font-bold tracking-tight ${subtleTextClass}`}>Output</div>
              {renderCodeBlock(outputDetails.output, compileErrorText ? (isLightTheme ? "text-red-700" : "text-red-300") : undefined)}
              {compileErrorText && (
                <div className="mt-2 rounded-md border border-red-500/20 bg-red-500/10 p-2 text-xs text-red-300">
                  {compileErrorText}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className={`w-full flex-1 min-h-0 flex flex-col gap-2 rounded-md p-2 overflow-y-auto ${panelClass}`}>
          <div className="flex items-baseline gap-2 flex-wrap">
            <h4 className={`text-xl font-bold ${statusClass}`}>
              {title}
            </h4>
            <span className={`text-[11px] ${runtimeTextClass}`}>Runtime: {runtime}</span>
          </div>

          {hasCaseDetails && (
            <div className="space-y-2">
              <div className="grid gap-2 md:grid-cols-2 items-stretch auto-rows-fr">
                <div className="h-full flex flex-col">
                    <div className="flex-1">
                      <div className={`rounded-lg border p-3 ${isLightTheme ? 'border-light-4 bg-white text-dark-1' : 'border-dark-4 bg-dark-3 text-white'}`}>
                        <div className={`mb-1 text-[12px] uppercase font-bold tracking-tight ${isLightTheme ? 'text-gray-500' : 'text-gray-200'}`}>Input</div>
                        {renderCodeBlock(outputDetails.caseInput)}
                      </div>
                    </div>
                </div>
                <div className="h-full flex flex-col">
                    <div className="flex-1">
                      <div className={`rounded-lg border p-3 ${isLightTheme ? 'border-light-4 bg-white text-dark-1' : 'border-dark-4 bg-dark-3 text-white'}`}>
                        <div className={`mb-1 text-[12px] uppercase font-bold tracking-tight ${isLightTheme ? 'text-gray-500' : 'text-gray-200'}`}>Output</div>
                        {renderCodeBlock(
                          outputDetails.caseOutput ?? outputDetails.output,
                          outputDetails.accepted
                            ? (isLightTheme ? "text-green-700" : "text-green-300")
                            : (isLightTheme ? "text-red-700" : "text-red-300")
                        )}
                      </div>
                    </div>
                </div>
              </div>
              <div>
                  <div className={`rounded-lg border p-3 ${isLightTheme ? 'border-light-4 bg-white text-dark-1' : 'border-dark-4 bg-dark-3 text-white'}`}>
                    <div className={`mb-1 text-[12px] uppercase font-bold tracking-tight ${isLightTheme ? 'text-gray-500' : 'text-gray-200'}`}>Expected</div>
                    {renderCodeBlock(outputDetails.caseExpected, isLightTheme ? "text-green-700" : "text-green-300")}
                  </div>
              </div>
            </div>
          )}

          {!hasCaseDetails && (
            <div>
              <div className={`text-[12px] uppercase font-bold tracking-tight ${subtleTextClass}`}>Output</div>
              {renderCodeBlock(outputDetails.output, compileErrorText ? (isLightTheme ? "text-red-700" : "text-red-300") : undefined)}
              {compileErrorText && (
                <div className="mt-2 rounded-md border border-red-500/20 bg-red-500/10 p-2 text-xs text-red-300">
                  {compileErrorText}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OutputWindow;

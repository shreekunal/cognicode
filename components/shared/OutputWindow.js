import React from "react";

const OutputWindow = ({ outputDetails, additionalStyles, theme = "dark" }) => {
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

  const renderCodeBlock = (value, tone = "text-white") => {
    if (value === null || value === undefined) {
      return (
        <pre className={`whitespace-pre-wrap rounded-md p-1 font-mono text-xs leading-5 text-gray-500 italic ${panelClass}`}>
          No output available
        </pre>
      );
    }

    if (value === "") {
      return (
        <pre className={`whitespace-pre-wrap rounded-md p-1 font-mono text-xs leading-5 text-gray-500 italic ${panelClass}`}>
          (Execution successful — no output)
        </pre>
      );
    }

    return (
      <pre className={`whitespace-pre-wrap rounded-md p-1 font-mono text-xs leading-5 ${tone} bg-transparent`}>
        {value}
      </pre>
    );
  };

  return (
    <div className={`!w-full flex-1 min-h-0 flex flex-col ${additionalStyles}`}>
      {!outputDetails ? (
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
              <div className="grid gap-2 md:grid-cols-2">
                <div>
                  <div className={`mb-0.5 text-[12px] uppercase font-bold tracking-tight ${subtleTextClass}`}>Input</div>
                  {renderCodeBlock(outputDetails.caseInput, "text-white")}
                </div>
                <div>
                  <div className={`mb-0.5 text-[12px] uppercase font-bold tracking-tight ${subtleTextClass}`}>Output</div>
                  {renderCodeBlock(outputDetails.caseOutput ?? outputDetails.output, outputDetails.accepted ? "text-green-300" : "text-red-300")}
                </div>
              </div>
              <div>
                <div className={`mb-0.5 text-[12px] uppercase font-bold tracking-tight ${subtleTextClass}`}>Expected</div>
                {renderCodeBlock(outputDetails.caseExpected, "text-green-300")}
              </div>
            </div>
          )}

          {!outputDetails.accepted && !hasCaseDetails && (
            <div>
              <div className={`mb-0.5 text-[12px] uppercase font-bold tracking-tight ${subtleTextClass}`}>Output</div>
              {renderCodeBlock(outputDetails.output, compileErrorText ? "text-red-300" : "text-white")}
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
              <div className="grid gap-2 md:grid-cols-2">
                <div>
                  <div className={`mb-0.5 text-[12px] uppercase font-bold tracking-tight ${subtleTextClass}`}>Input</div>
                  {renderCodeBlock(outputDetails.caseInput)}
                </div>
                <div>
                  <div className={`mb-0.5 text-[12px] uppercase font-bold tracking-tight ${subtleTextClass}`}>Output</div>
                  {renderCodeBlock(outputDetails.caseOutput ?? outputDetails.output, statusClass)}
                </div>
              </div>
              <div>
                <div className={`mb-0.5 text-[12px] uppercase font-bold tracking-tight ${subtleTextClass}`}>Expected</div>
                {renderCodeBlock(outputDetails.caseExpected, "text-green-300")}
              </div>
            </div>
          )}

          {!hasCaseDetails && (
            <div>
              <div className={`mb-0.5 text-[12px] uppercase font-bold tracking-tight ${subtleTextClass}`}>Output</div>
              {renderCodeBlock(outputDetails.output, compileErrorText ? "text-red-300" : "text-white")}
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

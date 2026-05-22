
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { eclipse } from "@uiw/codemirror-theme-eclipse";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import ReactCodeMirror from "@uiw/react-codemirror";
import { EditorView, Decoration, ViewPlugin } from "@codemirror/view";
import { getIndentUnit, indentUnit } from "@codemirror/language";

const indentationGuides = ViewPlugin.fromClass(class {
  constructor(view) {
    this.decorations = this.getDecorations(view);
  }
  update(update) {
    if (update.docChanged || update.viewportChanged) {
      this.decorations = this.getDecorations(update.view);
    }
  }
  getDecorations(view) {
    const builder = [];
    const unit = getIndentUnit(view.state);
    for (let { from, to } of view.visibleRanges) {
      for (let pos = from; pos < to;) {
        const line = view.state.doc.lineAt(pos);
        const text = line.text;
        let charCount = 0;
        while (charCount < text.length) {
          if (text[charCount] === " " || text[charCount] === "\t") {
            charCount++;
          } else {
            break;
          }
        }

        if (charCount > 0) {
          // Add a decoration to the leading whitespace
          builder.push(Decoration.mark({
            class: "cm-indent-guide",
            attributes: { style: `--indent-unit: ${unit}ch` }
          }).range(line.from, line.from + charCount));
        }
        pos = line.to + 1;
      }
    }
    // Correctly sort decorations
    return Decoration.set(builder.sort((a, b) => a.from - b.from));
  }
}, {
  decorations: v => v.decorations
});

const CodeEditorWindow = ({ onChange, language, code, theme, fontSize, fontFamily, showLineNumbers = true, showIndentationGuides = true, forProblemsPage = true, isInterview = false }) => {

  const handleEditorChange = (value) => {
    if (isInterview) onChange(value);
    else onChange('code', value);
  };

  const editorTheme = theme === 'dark' ? vscodeDark : eclipse;

  return (
    <div className={`flex flex-col !w-full justify-start items-end overlay rounded-none overflow-hidden shadow-4xl bg-[#121212] ${forProblemsPage ? 'min-h-[20%]' : 'h-[500px]'} max-md:h-[500px] ${showIndentationGuides ? 'show-indent-guides' : ''}`}>
      <style jsx global>{`
        .cm-indent-guide {
          background-image: repeating-linear-gradient(
            to right,
            ${theme === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'} 0px,
            ${theme === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'} 1px,
            transparent 1px,
            transparent var(--indent-unit, 2ch)
          );
          background-position: 0px center;
          background-repeat: no-repeat;
        }
          .show-indent-guides .cm-activeLine {
            background-color: rgba(255,255,255,0.02) !important;
          }
        .cm-matchingBracket {
          background-color: rgba(255,255,255,0.06) !important;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .cm-nonmatchingBracket {
          background-color: rgba(239, 68, 68, 0.12) !important;
          border-bottom: 1px solid rgba(239,68,68,0.9);
        }
      `}</style>
      <ReactCodeMirror
        value={code}
        onChange={handleEditorChange}
        extensions={[
          language === 'python3' ? python() : language === 'cpp' ? cpp() : language === 'java' ? java() : javascript(),
          indentUnit.of(language === 'python3' ? "    " : "  "),
          showIndentationGuides ? indentationGuides : []
        ]}
        theme={editorTheme}
        basicSetup={{
          lineNumbers: showLineNumbers,
          foldGutter: true,
          dropCursor: true,
          allowMultipleSelections: true,
          indentOnInput: true,
          bracketMatching: true,
          highlightActiveLine: true,
        }}
        style={{ fontSize: fontSize, fontFamily }}
      />
    </div>
  );
};
export default CodeEditorWindow;

'use client';
import { useState, useRef, useEffect } from 'react';
import { FiSend, FiTrash2 } from 'react-icons/fi';
import { BsStars } from 'react-icons/bs';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const SUGGESTED_TOPICS = [
  "Explain Big-O notation with examples",
  "How do hash maps work internally?",
  "Teach me dynamic programming step by step",
  "What's the difference between BFS and DFS?",
  "Explain recursion vs iteration with code",
  "How does a binary search tree work?",
];

export default function ChatTutor() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;

    const newMessages = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
      } else {
        setMessages([...newMessages, { role: 'assistant', content: `Error: ${data.error}` }]);
      }
    } catch (err) {
      setMessages([...newMessages, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Markdown rendering with react-markdown
  const markdownComponents = {
    h1: ({ children }) => <h1 className="text-xl font-bold mt-4 mb-2 dark:text-light-1">{children}</h1>,
    h2: ({ children }) => <h2 className="text-lg font-bold mt-3 mb-2 dark:text-light-1">{children}</h2>,
    h3: ({ children }) => <h3 className="text-base font-semibold mt-3 mb-1 dark:text-light-1">{children}</h3>,
    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
    ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
    li: ({ children }) => <li className="ml-1">{children}</li>,
    strong: ({ children }) => <strong className="font-bold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    hr: () => <hr className="my-3 border-gray-600" />,
    blockquote: ({ children }) => <blockquote className="border-l-3 border-red-500 pl-3 my-2 italic text-gray-400">{children}</blockquote>,
    a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-red-500 underline hover:text-red-400">{children}</a>,
    table: ({ children }) => <div className="overflow-x-auto my-2"><table className="min-w-full border border-gray-600 text-xs">{children}</table></div>,
    th: ({ children }) => <th className="border border-gray-600 px-2 py-1 bg-gray-700 text-left font-semibold">{children}</th>,
    td: ({ children }) => <td className="border border-gray-600 px-2 py-1">{children}</td>,
    code: ({ inline, className, children }) => {
      const lang = className?.replace('language-', '') || '';
      if (inline) {
        return <code className="bg-light-3 dark:bg-dark-3 px-1.5 py-0.5 rounded text-sm text-red-600 dark:text-red-400">{children}</code>;
      }
      return (
        <div className="my-2 rounded-lg overflow-hidden">
          {lang && <div className="bg-gray-700 text-gray-300 text-xs px-3 py-1 font-mono">{lang}</div>}
          <pre className="bg-gray-900 text-gray-100 p-3 overflow-x-auto text-sm">
            <code>{children}</code>
          </pre>
        </div>
      );
    },
    pre: ({ children }) => <>{children}</>,
  };

  const renderContent = (content) => (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {content}
    </ReactMarkdown>
  );

  return (
    <div className="flex flex-col h-[86vh] max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-light-4 dark:border-dark-4">
        <div className="flex items-center gap-2">
          <BsStars className="text-red-500" size={22} />
          <h1 className="text-lg font-bold dark:text-light-1">Learn with AI</h1>
          <span className="text-xs text-gray-400 ml-2">Ask anything about programming & DSA</span>
        </div>
        {messages.length > 0 && (
          <button onClick={clearChat} className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-light-3 dark:hover:bg-dark-4" title="Clear chat">
            <FiTrash2 size={16} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="text-center">
              <BsStars className="text-red-500 mx-auto mb-3" size={40} />
              <h2 className="text-2xl font-bold dark:text-light-1 mb-2">CogniCode AI Tutor</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md">
                Your personal programming teacher. Ask about data structures, algorithms, 
                concepts, or any coding topic — I'll explain with examples and code.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {SUGGESTED_TOPICS.map((topic, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(topic)}
                  className="text-left px-4 py-3 rounded-xl border border-light-4 dark:border-dark-4 text-sm text-gray-600 dark:text-gray-300 hover:bg-light-3 dark:hover:bg-dark-4 hover:border-gray-400 dark:hover:border-gray-500 transition-all"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-red-600 text-white rounded-br-md whitespace-pre-wrap'
                : 'bg-light-3 dark:bg-dark-4 text-dark-1 dark:text-light-1 rounded-bl-md'
            }`}>
              {msg.role === 'assistant' ? renderContent(msg.content) : msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-light-3 dark:bg-dark-4 rounded-2xl rounded-bl-md px-4 py-3 text-sm">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-light-4 dark:border-dark-4">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me about any programming concept..."
            rows={1}
            className="flex-1 resize-none rounded-xl bg-light-2 dark:bg-dark-3 border border-light-4 dark:border-dark-4 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 dark:text-light-1 placeholder:text-gray-400"
            style={{ maxHeight: '120px' }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex-shrink-0"
          >
            <FiSend size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

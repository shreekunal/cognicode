'use client';
import { useState, useRef, useEffect } from 'react';
import { FiSend, FiTrash2 } from 'react-icons/fi';
import { BsStars } from 'react-icons/bs';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function AskCogni({ problem, code, language }) {
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
            const context = `
Problem: ${problem?.title}
Statement: ${problem?.problemStatement?.replace(/<[^>]*>/g, '')}
Current Language: ${language?.label}
Current Code:
\`\`\`${language?.value}
${code}
\`\`\`
`;

            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        { role: 'system', content: `You are Cogni, an AI assistant helping a student with a coding problem. ${context}` },
                        ...newMessages
                    ]
                }),
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

    const markdownComponents = {
        h1: ({ children }) => <h1 className="text-lg font-bold mt-3 mb-1 text-gray-900 dark:text-light-1">{children}</h1>,
        h2: ({ children }) => <h2 className="text-base font-bold mt-2 mb-1 text-gray-900 dark:text-light-1">{children}</h2>,
        h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1 text-gray-900 dark:text-light-1">{children}</h3>,
        p: ({ children }) => <p className="mb-1.5 last:mb-0 leading-relaxed">{children}</p>,
        ul: ({ children }) => <ul className="list-disc list-inside mb-1.5 space-y-0.5">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside mb-1.5 space-y-0.5">{children}</ol>,
        li: ({ children }) => <li className="ml-1">{children}</li>,
        code: ({ node, className, children, ...props }) => {
            const lang = className?.replace('language-', '') || '';
            const isBlock = node?.position && node.position.start.line !== node.position.end.line || lang;
            if (!isBlock) {
                return <code className="bg-light-3 dark:bg-dark-4 px-1 py-0.5 rounded text-[12px] text-red-600 dark:text-red-400 font-mono" {...props}>{children}</code>;
            }
            return (
                <div className="my-2 rounded-lg overflow-hidden border border-light-4 dark:border-dark-4">
                    {lang && <div className="bg-light-3 dark:bg-dark-4 text-gray-500 dark:text-gray-400 text-[10px] px-3 py-1 font-mono uppercase tracking-widest">{lang}</div>}
                    <pre className="bg-white dark:bg-dark-1 p-3 overflow-x-auto text-[12px]">
                        <code className="!bg-transparent !border-0 !text-dark-1 dark:!text-light-1 !p-0 !m-0 !rounded-none !font-mono !whitespace-pre-wrap">{children}</code>
                    </pre>
                </div>
            );
        },
        pre: ({ children }) => <>{children}</>,
    };

    return (
        <div className="flex flex-col h-full bg-light-2 dark:bg-dark-3">
            <div className="flex items-center justify-between px-5 py-3 border-b border-light-3 dark:border-dark-4 bg-light-3/20">
                <div className="flex items-center gap-2">
                    {/* <BsStars className="text-red-500" size={18} /> */}
                    <h2 className="text-xs">Here I come ! How can i help you ? </h2>
                </div>
                {messages.length > 0 && (
                    <button onClick={clearChat} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-light-3 dark:hover:bg-dark-4" title="Clear chat">
                        <FiTrash2 size={14} />
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
                        <BsStars className="text-red-500 mb-3" size={42} />
                        <h3 className="text-lg font-bold mb-1 text-gray-900 dark:text-light-1">I'm here to help!</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[200px]">
                            Ask me about the problem, your code, or any bugs you're facing.
                        </p>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[90%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.role === 'user'
                            ? 'bg-red-600 text-white rounded-br-md shadow-sm'
                            : 'bg-white dark:bg-dark-2 text-gray-800 dark:text-light-2 border border-light-4 dark:border-dark-4 rounded-bl-md shadow-sm'
                            }`}>
                            {msg.role === 'assistant' ? (
                                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                    {msg.content}
                                </ReactMarkdown>
                            ) : (
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                            )}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white dark:bg-dark-2 rounded-2xl rounded-bl-md px-4 py-3 border border-light-4 dark:border-dark-4 shadow-sm">
                            <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="px-5 py-4 border-t border-light-3 dark:border-dark-4 bg-light-2 dark:bg-dark-3">
                <div className="flex gap-2 items-end">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your question..."
                        rows={1}
                        className="flex-1 resize-none rounded-xl bg-white dark:bg-dark-4 border border-light-4 dark:border-dark-4 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 dark:text-light-1 placeholder:text-gray-400"
                        style={{ maxHeight: '120px' }}
                        onInput={(e) => {
                            e.target.style.height = 'auto';
                            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                        }}
                    />
                    <button
                        onClick={() => sendMessage()}
                        disabled={!input.trim() || loading}
                        className="p-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex-shrink-0 shadow-sm"
                    >
                        <FiSend size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}

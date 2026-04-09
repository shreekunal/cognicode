'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ChatTutor from '@/components/ChatTutor';
import AdaptiveInterviewMode from '@/components/AdaptiveInterviewMode';

export default function LearnPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialTab = searchParams?.get('tab') === 'prepare-test' ? 'prepare-test' : 'learn';
    const [activeTab, setActiveTab] = useState(initialTab);

    useEffect(() => {
        const tab = searchParams?.get('tab') === 'prepare-test' ? 'prepare-test' : 'learn';
        setActiveTab(tab);
    }, [searchParams]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        if (tab === 'prepare-test') {
            router.replace('/learn?tab=prepare-test');
            return;
        }
        router.replace('/learn');
    };

    return (
        <div className="w-full mt-[9vh] px-4 py-3 space-y-4">
            <div className="max-w-6xl mx-auto">
                <div className="inline-flex p-1 rounded-xl bg-light-3 dark:bg-dark-4 border border-light-4 dark:border-dark-3">
                    <button
                        onClick={() => handleTabChange('learn')}
                        className={`px-4 py-2 text-sm rounded-lg transition-colors ${activeTab === 'learn'
                            ? 'bg-white dark:bg-dark-2 text-dark-1 dark:text-light-1 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-dark-1 dark:hover:text-light-1'}`}
                    >
                        Learn with AI
                    </button>
                    <button
                        onClick={() => handleTabChange('prepare-test')}
                        className={`px-4 py-2 text-sm rounded-lg transition-colors ${activeTab === 'prepare-test'
                            ? 'bg-white dark:bg-dark-2 text-dark-1 dark:text-light-1 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-dark-1 dark:hover:text-light-1'}`}
                    >
                        Prepare & Test
                    </button>
                </div>
            </div>

            <div className="max-w-6xl mx-auto">
                {activeTab === 'learn' ? <ChatTutor /> : <AdaptiveInterviewMode />}
            </div>
        </div>
    );
}
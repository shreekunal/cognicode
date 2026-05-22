'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ChatTutor from '@/components/ChatTutor';
import AdaptiveInterviewMode from '@/components/AdaptiveInterviewMode';

export default function LearnPage() {
    const searchParams = useSearchParams();
    const initialTab = searchParams?.get('tab') === 'prepare-test' ? 'prepare-test' : 'learn';
    const [activeTab, setActiveTab] = useState(initialTab);

    useEffect(() => {
        const tab = searchParams?.get('tab') === 'prepare-test' ? 'prepare-test' : 'learn';
        setActiveTab(tab);
    }, [searchParams]);

    return (
        <div className="w-full px-4 py-3 space-y-4">
            <div className="max-w-6xl mx-auto">
                {activeTab === 'learn' ? <ChatTutor /> : <AdaptiveInterviewMode />}
            </div>
        </div>
    );
}
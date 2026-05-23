import React, { useMemo, useState, useEffect } from 'react';

const PerformanceGraph = ({ type, userValue, label, unit }) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Generate mock distribution data around the user's value
    const data = useMemo(() => {
        const numBuckets = 30;
        const distribution = [];
        
        // Use userValue as a seed for consistent-ish results for the same code
        const seedValue = parseFloat(userValue) || 10;
        
        // User's relative position (faster/smaller is better, so lower index is better)
        // We simulate that user is in the top 30-70% usually
        const userBucketIndex = 5 + Math.floor((seedValue % 15)); 
        
        const bucketWidth = Math.max(1, seedValue * 0.08);
        const baseValue = Math.max(0.1, seedValue - (userBucketIndex * bucketWidth));
        
        for (let i = 0; i < numBuckets; i++) {
            const bucketVal = baseValue + i * bucketWidth;
            // Create a bell curve center
            const center = numBuckets / 2;
            const distanceToCenter = Math.abs(i - center);
            
            // Bell curve height
            let height = Math.floor(Math.exp(-Math.pow(distanceToCenter, 2) / 40) * 100);
            
            // deterministic randomness based on i
            const noise = (Math.sin(i * 1.5) + 1) * 5;
            height += Math.floor(noise);
            
            const isUserBucket = i === userBucketIndex;
            
            distribution.push({
                x: bucketVal,
                y: Math.max(2, height), 
                isUserBucket
            });
        }
        
        // Normalize heights for visualization
        const maxY = Math.max(...distribution.map(d => d.y));
        distribution.forEach(d => {
            d.heightPct = Math.max(4, (d.y / maxY) * 100);
        });
        
        return distribution;
    }, [userValue]);

    // Calculate "Beats X%" based on position (assuming lower is better)
    const beatsPercent = useMemo(() => {
        let betterUsers = 0;
        let worseUsers = 0;
        let totalUsers = 0;
        let foundUser = false;
        
        data.forEach(d => {
            totalUsers += d.y;
            if (d.isUserBucket) {
                foundUser = true;
            } else if (!foundUser) {
                // If user is at index 10, people at index 0-9 are BETTER (faster/less memory)
                betterUsers += d.y;
            } else {
                // People after are WORSE
                worseUsers += d.y;
            }
        });
        
        return Math.min(99, Math.max(1, Math.floor((worseUsers / totalUsers) * 100)));
    }, [data]);

    if (!mounted) return null;

    return (
        <div className="w-full flex flex-col">
            <div className="flex justify-between items-baseline mb-3">
                <h4 className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-widest">{label} Distribution</h4>
                <div className="text-xs font-medium">
                    Beats <span className="text-indigo-500 font-bold">{beatsPercent}%</span>
                </div>
            </div>
            
            <div className="flex items-end h-24 gap-[1px] w-full border-b border-light-4 dark:border-dark-4 pb-0 relative">
                {data.map((item, i) => (
                    <div 
                        key={i} 
                        className="flex-1 flex flex-col justify-end group relative h-full"
                    >
                        <div 
                            className={`w-full rounded-t-[1px] transition-all duration-700 ease-out ${item.isUserBucket ? 'bg-indigo-500 z-[1]' : 'bg-gray-200 dark:bg-dark-4 hover:bg-gray-300 dark:hover:bg-dark-1'}`}
                            style={{ height: `${item.heightPct}%` }}
                        ></div>
                        
                        {/* Indicator dot for user */}
                        {item.isUserBucket && (
                            <div className="absolute -bottom-[3px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-indigo-500 border border-white dark:border-dark-2 z-10"></div>
                        )}

                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20 bg-dark-1 text-white text-[9px] px-2 py-1 rounded whitespace-nowrap shadow-xl pointer-events-none">
                            <div className="flex flex-col items-center">
                                <span className="font-bold opacity-70">{item.isUserBucket ? "Your Solution" : "Others"}</span>
                                <span>{item.x < 1 ? item.x.toFixed(3) : Math.round(item.x)} {unit}</span>
                            </div>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-dark-1"></div>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="flex justify-between text-[9px] text-gray-400 mt-1.5 font-bold uppercase tracking-tighter">
                <span>{data[0].x < 1 ? data[0].x.toFixed(2) : Math.round(data[0].x)} {unit}</span>
                <span>{data[data.length-1].x < 1 ? data[data.length-1].x.toFixed(2) : Math.round(data[data.length-1].x)} {unit}</span>
            </div>
        </div>
    );
};

export default PerformanceGraph;
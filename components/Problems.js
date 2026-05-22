
'use client'
import React, { useEffect, useState, useMemo } from 'react';
import { ImCheckboxChecked } from "react-icons/im";
import { FiSearch, FiX } from "react-icons/fi";
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { slugify } from '@/utils/slugify';

const Problems = () => {
    const router = useRouter();
    const { data: session } = useSession();
    const [problems, setProblems] = useState([]);
    const [solvedIds, setSolvedIds] = useState(new Set());

    // Filters
    const [search, setSearch] = useState('');
    const [difficultyFilter, setDifficultyFilter] = useState('All');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All'); // All | Solved | Unsolved

    useEffect(() => {
        const fetchProblems = async () => {
            const response = await fetch('/cognicode/api/getAllProblems');
            const data = await response.json();
            setProblems(data);
        }
        fetchProblems();
    }, []);

    useEffect(() => {
        if (!session?.user?._id) return;
        const fetchSolved = async () => {
            try {
                const res = await fetch('/cognicode/api/getUserStats');
                const data = await res.json();
                if (data.ok && data.stats?.solvedProblemIds) {
                    setSolvedIds(new Set(data.stats.solvedProblemIds));
                }
            } catch (e) { /* ignore */ }
        };
        fetchSolved();
    }, [session]);

    const categories = useMemo(() => {
        const cats = new Set(problems.map(p => p.category).filter(Boolean));
        return ['All', ...Array.from(cats).sort()];
    }, [problems]);

    const filtered = useMemo(() => {
        return problems.filter(p => {
            if (search && !p.title?.toLowerCase().includes(search.toLowerCase()) && !p.category?.toLowerCase().includes(search.toLowerCase())) return false;
            if (difficultyFilter !== 'All' && p.difficulty !== difficultyFilter) return false;
            if (categoryFilter !== 'All' && p.category !== categoryFilter) return false;
            if (statusFilter === 'Solved' && !solvedIds.has(p.id)) return false;
            if (statusFilter === 'Unsolved' && solvedIds.has(p.id)) return false;
            return true;
        });
    }, [problems, search, difficultyFilter, categoryFilter, statusFilter, solvedIds]);

    const difficultyColors = {
        'Hard': 'bg-red-700',
        'Medium': 'bg-red-500',
        'Easy': 'bg-red-300 text-red-900'
    };

    const activeFilterCount = [difficultyFilter !== 'All', categoryFilter !== 'All', statusFilter !== 'All', search !== ''].filter(Boolean).length;

    const clearFilters = () => {
        setSearch('');
        setDifficultyFilter('All');
        setCategoryFilter('All');
        setStatusFilter('All');
    };

    return (
        <div>
            <div className="p-10 max-md:p-3">
                <div className="max-w-6xl mx-auto">
                    {/* Search and Filters */}
                    <div className="mb-4 flex flex-col gap-3">
                        {/* Search bar */}
                        <div className="relative">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search problems by name or category..."
                                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-light-2 dark:bg-dark-3 border border-light-4 dark:border-dark-4 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 dark:text-light-1 placeholder:text-gray-400"
                            />
                            {search && (
                                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    <FiX size={16} />
                                </button>
                            )}
                        </div>

                        {/* Filter row */}
                        <div className="flex flex-wrap gap-2 items-center">
                            {/* Difficulty */}
                            <div className="flex gap-1 bg-light-3 dark:bg-dark-4 rounded-lg p-0.5">
                                {['All', 'Easy', 'Medium', 'Hard'].map(d => (
                                    <button
                                        key={d}
                                        onClick={() => setDifficultyFilter(d)}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${difficultyFilter === d
                                            ? 'bg-white dark:bg-dark-2 text-dark-1 dark:text-light-1 shadow-sm'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-dark-1 dark:hover:text-light-1'
                                            }`}
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>

                            {/* Category dropdown */}
                            <select
                                value={categoryFilter}
                                onChange={e => setCategoryFilter(e.target.value)}
                                className="px-3 py-1.5 text-xs rounded-lg bg-light-3 dark:bg-dark-4 border-none text-dark-1 dark:text-light-1 focus:ring-2 focus:ring-accent/40"
                            >
                                {categories.map(c => (
                                    <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
                                ))}
                            </select>

                            {/* Status filter */}
                            <div className="flex gap-1 bg-light-3 dark:bg-dark-4 rounded-lg p-0.5">
                                {['All', 'Solved', 'Unsolved'].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setStatusFilter(s)}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${statusFilter === s
                                            ? 'bg-white dark:bg-dark-2 text-dark-1 dark:text-light-1 shadow-sm'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-dark-1 dark:hover:text-light-1'
                                            }`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>

                            {activeFilterCount > 0 && (
                                <button onClick={clearFilters} className="px-3 py-1.5 text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                                    <FiX size={12} /> Clear filters
                                </button>
                            )}

                            <span className="text-xs text-gray-400 ml-auto">
                                {filtered.length} of {problems.length} problems
                            </span>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="relative overflow-auto rounded-xl shadow-xl">
                        <table className="w-full text-sm text-left rtl:text-right">
                            <thead className="text-gray-700 uppercase bg-light-3 dark:bg-dark-3 dark:text-light-1">
                                <tr>
                                    <th scope="col" className="p-6">Sr No.</th>
                                    <th scope="col" className="p-6">Problem Title</th>
                                    <th scope="col" className="p-6 text-center">Difficulty</th>
                                    <th scope="col" className="p-6 text-left">Category</th>
                                    <th scope="col" className="p-6 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((problem, index) => (
                                    <tr key={problem.id || index} className="bg-light-2 dark:bg-dark-3 hover:bg-light-4 dark:hover:bg-dark-4">
                                        <td className="p-4 text-center">{index + 1}</td>
                                        <th scope="row" className="px-6 py-4 hover:text-red-500 hover:font-semibold hover:cursor-pointer font-medium whitespace-nowrap transition-all ease-in">
                                            <div className='w-[300px] text-ellipsis overflow-hidden'
                                                onClick={() => router.push(`/problems/${problem.id}/${slugify(problem.title)}`)}>
                                                {problem.title}
                                            </div>
                                        </th>
                                        <td className="px-6 py-4 text-center">
                                            <div className={`w-20 mx-auto px-2 py-1 rounded-full text-sm text-light-1 text-center ${difficultyColors[problem?.difficulty]}`}>
                                                {problem.difficulty}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-left">{problem.category}</td>
                                        <td className="px-6 py-4 cursor-pointer text-center">
                                            {solvedIds.has(problem.id) ? (
                                                <ImCheckboxChecked size={20} className='mx-auto text-red-500' />
                                            ) : (
                                                <span className="text-gray-400 text-xs">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-gray-400 dark:text-gray-500">
                                            No problems match your filters
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Problems;
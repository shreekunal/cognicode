
'use client'
import React, { useEffect, useState } from 'react';
import { AiOutlineSolution } from "react-icons/ai";
import { ImCheckboxChecked } from "react-icons/im";
import { useRouter } from 'next/navigation';
import { mockProblemsData } from '@/constants';

const Problems = () => {
    const router = useRouter();
    const [problems, setProblems] = useState([]);


    useEffect(() => {
        const fetchProblems = async () => {
            const response = await fetch('/api/getAllProblems');
            const data = await response.json();
            setProblems(data);
        }
        fetchProblems();
    }, []);

    const difficultyColors = {
        'Hard': 'bg-red-700',
        'Medium': 'bg-orange-600',
        'Easy': 'bg-green-600'
    };



    return (
        <div>
            <div className="p-10 max-md:p-3">
                <div className="relative overflow-auto rounded-xl shadow-xl max-w-6xl mx-auto">
                    <table className="w-full text-sm text-left rtl:text-right">
                        <thead className=" text-gray-700 uppercase bg-light-3 dark:bg-dark-3 dark:text-light-1">
                            <tr>
                                <th scope="col" className="p-6">
                                    Sr No.
                                </th>
                                <th scope="col" className="p-6">
                                    Problem Title
                                </th>
                                <th scope="col" className="p-6 text-center">
                                    Difficulty
                                </th>
                                <th scope="col" className="p-6 text-left">
                                    Category
                                </th>
                                <th scope="col" className="p-6 text-center">
                                    Status
                                </th>

                            </tr>
                        </thead>
                        <tbody>
                            {problems.map((problem, index) => (
                                <tr key={index} className="bg-light-2 dark:bg-dark-3 hover:bg-light-4 dark:hover:bg-dark-4">
                                    <td className="p-4 text-center">
                                        <div>
                                            {index + 1}
                                        </div>
                                    </td>
                                    <th scope="row" className="px-6 py-4 hover:text-blue-500 hover:font-semibold hover:cursor-pointer font-medium whitespace-nowrap transition-all ease-in">
                                        <div className='w-[300px] text-ellipsis overflow-hidden'
                                            onClick={() => {
                                                router.push(`/problems/${problem.id}`);
                                            }}>
                                            {problem.title}
                                        </div>
                                    </th>
                                    <td className="px-6 py-4 text-center">
                                        <div className={`w-20 mx-auto px-2 py-1 rounded-full hover:cursor-pointer text-sm text-light-1 text-center ${difficultyColors[problem?.difficulty]}`}>
                                            {problem.difficulty}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-left">
                                        {problem.category}
                                    </td>
                                    <td className="px-6 py-4 cursor-pointer text-center">
                                        <ImCheckboxChecked size={20} color={'green'} className='mx-auto' />
                                    </td>

                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    )
}

export default Problems;
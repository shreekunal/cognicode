"use client";
import Workspace from '@/components/workspace/Workspace'
import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

const ProblemPage = () => {
  const params = useParams();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const response = await fetch(`/cognicode/api/getProblembyId?id=${params.id}`);
        const data = await response.json();
        if (data) {
          setProblems([data]); // Wrap single problem in array for compatibility
        }
      } catch (err) {
        console.error("Failed to fetch problem:", err);
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchProblem();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[92vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-accent" />
      </div>
    );
  }

  return <Workspace problems={problems} />;
};

export default ProblemPage;
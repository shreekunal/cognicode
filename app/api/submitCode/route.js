import dbConnect from '@/utils/dbConnect';
import { Problem } from "@/models/Problem";
import { User } from "@/models/User";
import { UserInfo } from "@/models/UserInfo.js";

import { SolvedProblem } from "@/models/SolvedProblem";
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route.js"

export async function POST(req) {
    await dbConnect();
    const session = await getServerSession(authOptions);
    const userID = session?.user?._id;
    if (!userID) {
        return new Response('User Not Found', { status: 401 });
    }

    try {
        const { code, problem, language, contest } = await req.json();
        const user = await User.findById(userID);
        const userdata = await UserInfo.findById(user.userInfo).populate('solved');
        const prob = await Problem.findOne({ id: problem });

        if (!prob) {
            return new Response(JSON.stringify({ isAccepted: 'rejected', output: 'Problem not found' }), { status: 404 });
        }

        if (!prob.testCases || prob.testCases.length === 0) {
            return new Response(JSON.stringify({ isAccepted: 'rejected', output: 'No test cases available' }), { status: 400 });
        }

        const existingSolvedProblem = userdata.solved.find(
            (solvedProblem) => solvedProblem.problem.equals(prob._id)
        );

        // Run ALL test cases using batch execution (single API call)
        const { executeCode, executeBatch } = await import('@/utils/pistonAPI');
        const totalTestCases = prob.testCases.length;

        // Collect all inputs for batch — join multi-line inputs with newlines
        const inputs = prob.testCases.map(tc => Array.isArray(tc.input) ? tc.input.join('\n') : (tc.input || ''));
        const expectedOutputs = prob.testCases.map(tc => Array.isArray(tc.output) ? tc.output.join('\n') : (tc.output || ''));

        let results;
        try {
            results = await executeBatch(language, code, inputs);
        } catch (batchErr) {
            // Fallback to sequential if batch fails
            results = [];
            for (const input of inputs) {
                const data = await executeCode(language, code, input);
                results.push(data);
            }
        }

        let passedCount = 0;
        let lastOutput = '';
        let lastExecData = {};

        for (let i = 0; i < totalTestCases; i++) {
            const data = results[i] || { output: '', cpuTime: 0, memory: 0 };
            lastOutput = data.output;
            lastExecData = data;

            if (data.output?.trim() === expectedOutputs[i].trim()) {
                passedCount++;
            }
        }

        const isAccepted = passedCount === totalTestCases ? "accepted" : "rejected";

        const newSolution = {
            contest: contest !== null ? contest : undefined,
            code: code,
            language: language,
            complexity: [lastExecData.cpuTime || '0', lastExecData.memory || '0'],
            status: isAccepted,
            passedTestCases: passedCount
        };

        if (existingSolvedProblem) {
            existingSolvedProblem.solution.push(newSolution);
            await existingSolvedProblem.save();
            return new Response(JSON.stringify({
                isAccepted,
                output: lastOutput,
                passedTestCases: passedCount,
                totalTestCases,
                cpuTime: lastExecData.cpuTime || '0',
                memory: lastExecData.memory || '0'
            }), { status: 201 });
        } else {
            if ((isAccepted === "accepted" && contest) || !contest) {
                const newSolve = new SolvedProblem({
                    contest: contest !== null ? contest : undefined,
                    problem: prob._id,
                    solution: [newSolution]
                });
                const newSol = await newSolve.save();
                userdata.solved.push(newSol.id);
                await userdata.save();
                return new Response(JSON.stringify({
                    isAccepted,
                    output: lastOutput,
                    passedTestCases: passedCount,
                    totalTestCases,
                    cpuTime: lastExecData.cpuTime || '0',
                    memory: lastExecData.memory || '0'
                }), { status: 201 });
            } else {
                return new Response(JSON.stringify({
                    isAccepted: 'rejected',
                    output: lastOutput,
                    passedTestCases: passedCount,
                    totalTestCases,
                    cpuTime: lastExecData.cpuTime || '0',
                    memory: lastExecData.memory || '0'
                }), { status: 200 });
            }
        }
    } catch (error) {
        console.error('submitCode error:', error);
        return new Response(JSON.stringify({ isAccepted: 'rejected', output: 'Server error: ' + error.message }), { status: 500 });
    }
}
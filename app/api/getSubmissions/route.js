import dbConnect from '@/utils/dbConnect';
import { User } from "@/models/User";
import { UserInfo } from "@/models/UserInfo";
import { SolvedProblem } from "@/models/SolvedProblem";
import { Problem } from "@/models/Problem";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route.js";

export async function GET(req) {
    await dbConnect();
    const session = await getServerSession(authOptions);
    const userID = session?.user?._id;
    if (!userID) {
        return Response.json({ ok: false, error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const problemId = searchParams.get('problemId'); // the string id like "p1"

    try {
        const user = await User.findById(userID);
        if (!user) return Response.json({ ok: false, error: 'User not found' }, { status: 404 });

        const userInfo = await UserInfo.findById(user.userInfo).populate({
            path: 'solved',
            populate: { path: 'problem', select: 'id title' }
        });

        if (!userInfo) return Response.json({ ok: true, submissions: [] });

        // Filter solved entries for this specific problem
        const matching = userInfo.solved.filter(s => s.problem && s.problem.id === problemId);

        // Flatten all solutions from matching SolvedProblem docs
        const submissions = [];
        for (const sp of matching) {
            for (const sol of sp.solution) {
                submissions.push({
                    code: sol.code,
                    status: sol.status,
                    isAccepted: sol.status, // Add isAccepted for frontend compatibility
                    language: sol.language || 'unknown',
                    passedTestCases: sol.passedTestCases,
                    cpuTime: sol.complexity?.[0] || '0',
                    memory: sol.complexity?.[1] || '0',
                    submittedAt: sol.submissionTime,
                });
            }
        }

        // Sort newest first
        submissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

        return Response.json({ ok: true, submissions });
    } catch (err) {
        return Response.json({ ok: false, error: err.message }, { status: 500 });
    }
}

import dbConnect from '@/utils/dbConnect';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route.js";
import { User } from "@/models/User";
import { UserInfo } from "@/models/UserInfo.js";
import { SolvedProblem } from "@/models/SolvedProblem";
import { Problem } from "@/models/Problem";

export async function GET() {
  await dbConnect();

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?._id) {
      return new Response(JSON.stringify({ ok: false, error: "Not logged in" }), { status: 401 });
    }

    const user = await User.findById(session.user._id);
    const userInfo = await UserInfo.findById(user.userInfo).populate({
      path: 'solved',
      populate: { path: 'problem', model: 'Problem' }
    });

    if (!userInfo) {
      return new Response(JSON.stringify({ ok: true, stats: { accuracy: 0, problemsSolved: 0, solvedProblemIds: [], solvedCategories: {}, solvedByDifficulty: { Easy: 0, Medium: 0, Hard: 0 }, avgTime: 0, recentDifficulty: "Easy", recentSubmissions: [], stuckCategories: [] } }), { status: 200 });
    }

    const solvedEntries = userInfo.solved || [];
    let totalAccepted = 0;
    let totalSubmissions = 0;
    let totalTime = 0;
    let timeCount = 0;
    const solvedProblemIds = [];
    const solvedCategories = {}; // { category: { total: N, accepted: N, difficulty } }
    const solvedByDifficulty = { Easy: 0, Medium: 0, Hard: 0 }; // unique problems per difficulty
    let recentDifficulty = "Easy";

    // Collect ALL submissions with timestamps for recency analysis
    const allSubmissions = [];

    for (const entry of solvedEntries) {
      const problem = entry.problem;
      if (!problem) continue;

      solvedProblemIds.push(problem.id);
      const category = problem.category || "Unknown";
      const difficulty = problem.difficulty || "Easy";

      // Count unique solved problems per difficulty
      const hasAccepted = (entry.solution || []).some(s => s.status === 'accepted');
      if (hasAccepted && solvedByDifficulty[difficulty] !== undefined) {
        solvedByDifficulty[difficulty]++;
      }

      if (!solvedCategories[category]) {
        solvedCategories[category] = { total: 0, accepted: 0, difficulty };
      }

      for (const submission of (entry.solution || [])) {
        totalSubmissions++;
        solvedCategories[category].total++;

        const subRecord = {
          problemId: problem.id,
          category,
          difficulty,
          status: submission.status,
          time: submission.submissionTime || null,
        };

        if (submission.status === 'accepted') {
          totalAccepted++;
          solvedCategories[category].accepted++;
        }

        // Extract time from complexity array [cpuTime, memory]
        if (submission.complexity && submission.complexity[0]) {
          const cpuTime = parseFloat(submission.complexity[0]);
          if (!isNaN(cpuTime)) {
            totalTime += cpuTime;
            timeCount++;
            subRecord.cpuTime = cpuTime;
          }
        }

        allSubmissions.push(subRecord);
      }

      recentDifficulty = difficulty;
    }

    // Sort all submissions by time descending, take last 20 for recency analysis
    allSubmissions.sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));
    const recentSubmissions = allSubmissions.slice(0, 20);

    // Detect stuck categories: categories where the last 3+ submissions are all rejected
    const stuckCategories = [];
    const categoryRecentSubs = {};
    for (const sub of recentSubmissions) {
      if (!categoryRecentSubs[sub.category]) categoryRecentSubs[sub.category] = [];
      categoryRecentSubs[sub.category].push(sub.status);
    }
    for (const [cat, statuses] of Object.entries(categoryRecentSubs)) {
      const recentSlice = statuses.slice(0, 3);
      if (recentSlice.length >= 3 && recentSlice.every(s => s === 'rejected')) {
        stuckCategories.push(cat);
      }
    }

    const accuracy = totalSubmissions > 0 ? totalAccepted / totalSubmissions : 0;
    const avgTime = timeCount > 0 ? totalTime / timeCount : 0;

    // Recency-weighted accuracy: weight recent submissions 2x more
    let recentWeightedAcc = accuracy;
    if (recentSubmissions.length > 0) {
      let wSum = 0, wTotal = 0;
      recentSubmissions.forEach((sub, i) => {
        const weight = Math.max(1, recentSubmissions.length - i); // most recent = highest weight
        wSum += (sub.status === 'accepted' ? 1 : 0) * weight;
        wTotal += weight;
      });
      recentWeightedAcc = wTotal > 0 ? wSum / wTotal : accuracy;
    }

    return new Response(JSON.stringify({
      ok: true,
      stats: {
        accuracy,
        recentWeightedAccuracy: recentWeightedAcc,
        problemsSolved: solvedProblemIds.length,
        solvedProblemIds,
        solvedCategories,
        avgTime,
        totalSubmissions,
        totalAccepted,
        recentDifficulty,
        rating: userInfo.rating || 50,
        recentSubmissions,
        stuckCategories,
        solvedByDifficulty,
      }
    }), { status: 200 });

  } catch (error) {
    console.error('getUserStats error:', error);
    return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
  }
}

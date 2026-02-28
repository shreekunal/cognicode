"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import axios from "axios";

export default function ProfileSection() {
  const [data, setData] = useState({});
  const [stats, setStats] = useState(null);
  const [totalProblems, setTotalProblems] = useState({ Easy: 0, Medium: 0, Hard: 0 });

  async function fetchUserInfo() {
    try {
      const response = await axios.get("/api/getUserInfo");
      const data = response.data;
      setData(data);
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  }

  async function fetchStats() {
    try {
      const res = await fetch("/api/getUserStats");
      const data = await res.json();
      if (data.ok) setStats(data.stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }

  async function fetchTotalProblems() {
    try {
      const res = await fetch("/api/getAllProblems");
      const problems = await res.json();
      const counts = { Easy: 0, Medium: 0, Hard: 0 };
      problems.forEach(p => {
        if (counts[p.difficulty] !== undefined) counts[p.difficulty]++;
      });
      setTotalProblems(counts);
    } catch (error) {
      console.error("Error fetching problems:", error);
    }
  }

  useEffect(() => {
    fetchUserInfo();
    fetchStats();
    fetchTotalProblems();
  }, []);

  // Use pre-computed unique problem counts per difficulty from backend
  const solvedByDifficulty = stats?.solvedByDifficulty || { Easy: 0, Medium: 0, Hard: 0 };

  // Build skills from solved categories
  const skills = { Advanced: [], Intermediate: [], Fundamental: [] };
  if (stats?.solvedCategories) {
    Object.entries(stats.solvedCategories).forEach(([cat, data]) => {
      const count = data.accepted || 0;
      if (count === 0) return;
      const difficulty = data.difficulty || 'Easy';
      if (difficulty === 'Hard') skills.Advanced.push({ name: cat, count });
      else if (difficulty === 'Medium') skills.Intermediate.push({ name: cat, count });
      else skills.Fundamental.push({ name: cat, count });
    });
  }

  /* Info rows for the profile card */
  const infoRows = [
    { label: "Age", value: data.age },
    { label: "Gender", value: data.gender },
    { label: "College", value: data.college },
    { label: "City", value: data.city },
    { label: "Country", value: data.country },
    { label: "Rating", value: data.rating },
  ];

  const totalSolved = stats?.problemsSolved || 0;
  const accuracy = stats ? Math.round((stats.accuracy || 0) * 100) : 0;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-10 min-h-screen">
      {/* Page header */}
      <div className="mb-10 animate-on-load animate-slide-down">
        <h1 className="text-3xl font-bold text-dark-1 dark:text-light-1">Profile</h1>
        <div className="h-1 w-12 bg-accent rounded-full mt-2"></div>
      </div>

      {/* Main grid — left sidebar / right content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* === LEFT COLUMN (1/3) === */}
        <div className="flex flex-col gap-6 lg:col-span-1">

          {/* User Info Card */}
          <div className="bg-light-2 dark:bg-dark-3 rounded-2xl shadow-lg p-6 card-hover border border-transparent hover:border-accent/20 animate-on-load animate-slide-up delay-100">
            <h2 className="text-2xl font-bold text-dark-1 dark:text-light-1 mb-1">
              {data.name || "User"}
            </h2>
            <p className="text-sm text-gray-1 dark:text-gray-2 mb-4">{data.email}</p>

            <div className="space-y-2.5">
              {infoRows.map((row) => (
                <div key={row.label} className="flex items-center gap-2">
                  <span className="font-medium min-w-[80px] text-sm text-gray-1 dark:text-gray-2">{row.label}:</span>
                  <span className="text-sm text-dark-1 dark:text-light-4">{row.value || "—"}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2 mt-5">
              <Link
                href="/edit-profile"
                className="bg-accent hover:bg-accent-dark text-white font-semibold py-2.5 px-4 rounded-xl text-center text-sm transition-colors duration-300"
              >
                Edit Profile
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="bg-light-3 dark:bg-dark-4 hover:bg-light-4 dark:hover:bg-dark-2 text-dark-1 dark:text-light-1 font-semibold py-2.5 px-4 rounded-xl text-center text-sm transition-colors duration-300"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Skills Card */}
          <div className="bg-light-2 dark:bg-dark-3 rounded-2xl shadow-lg p-6 card-hover border border-transparent hover:border-accent/20 animate-on-load animate-slide-up delay-300">
            <h3 className="text-lg font-bold text-dark-1 dark:text-light-1 mb-4">Skills</h3>
            {Object.entries(skills).map(([category, skillList]) => (
              skillList.length > 0 && (
                <div key={category} className="mb-4 last:mb-0">
                  <h4 className="text-sm font-semibold text-accent mb-1.5">{category}</h4>
                  <div className="flex flex-wrap gap-2">
                    {skillList.map((skill, index) => (
                      <span
                        key={index}
                        className="text-xs bg-light-3 dark:bg-dark-4 text-dark-1 dark:text-light-4 px-3 py-1.5 rounded-full border border-light-4 dark:border-dark-4"
                      >
                        {skill.name} <span className="text-accent font-semibold">×{skill.count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )
            ))}
            {Object.values(skills).every(s => s.length === 0) && (
              <p className="text-sm text-gray-1 dark:text-gray-2">Solve problems to build your skill profile</p>
            )}
          </div>
        </div>

        {/* === RIGHT COLUMN (2/3) === */}
        <div className="flex flex-col gap-6 lg:col-span-2">

          {/* Solved Problems Card */}
          <div className="bg-light-2 dark:bg-dark-3 rounded-2xl shadow-lg p-6 card-hover border border-transparent hover:border-accent/20 animate-on-load animate-slide-up delay-200">
            <h3 className="text-lg font-bold text-dark-1 dark:text-light-1 mb-5">Solved Problems</h3>
            <div className="flex gap-8 items-center w-full max-sm:flex-col max-sm:items-start">

              {/* Donut-style circle */}
              <div className="relative min-w-[110px] min-h-[110px]">
                <div className="w-[110px] h-[110px] rounded-full bg-light-4 dark:bg-dark-4 flex justify-center items-center">
                  <div className="w-[90px] h-[90px] rounded-full bg-light-2 dark:bg-dark-3 flex flex-col justify-center items-center">
                    <span className="text-2xl font-bold text-dark-1 dark:text-light-1">{totalSolved}</span>
                    <span className="text-xs text-gray-1 dark:text-gray-2">Solved</span>
                  </div>
                </div>
              </div>

              {/* Progress bars */}
              <div className="flex-grow w-full space-y-3">
                <ProgressBar label="Easy" solved={solvedByDifficulty.Easy} total={totalProblems.Easy} color="bg-green-500" />
                <ProgressBar label="Medium" solved={solvedByDifficulty.Medium} total={totalProblems.Medium} color="bg-yellow-500" />
                <ProgressBar label="Hard" solved={solvedByDifficulty.Hard} total={totalProblems.Hard} color="bg-accent" />
              </div>
            </div>
            {stats && (
              <div className="mt-4 pt-4 border-t border-light-4 dark:border-dark-4 flex flex-wrap gap-4 text-sm text-gray-1 dark:text-gray-2">
                <span>Accuracy: <strong className="text-dark-1 dark:text-light-1">{accuracy}%</strong></span>
                <span>Submissions: <strong className="text-dark-1 dark:text-light-1">{stats.totalSubmissions}</strong></span>
                <span>Accepted: <strong className="text-dark-1 dark:text-light-1">{stats.totalAccepted}</strong></span>
              </div>
            )}
          </div>

          {/* Streak & Activity Card */}
          <div className="bg-light-2 dark:bg-dark-3 rounded-2xl shadow-lg p-6 card-hover border border-transparent hover:border-accent/20 animate-on-load animate-slide-up delay-300">
            <h3 className="text-lg font-bold text-dark-1 dark:text-light-1 mb-4">Activity</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-light-3 dark:bg-dark-4 rounded-xl">
                <div className="text-2xl font-bold text-orange-500">{stats?.currentStreak || 0}</div>
                <div className="text-xs text-gray-1 dark:text-gray-2 mt-1">Current Streak</div>
              </div>
              <div className="text-center p-3 bg-light-3 dark:bg-dark-4 rounded-xl">
                <div className="text-2xl font-bold text-purple-500">{stats?.maxStreak || 0}</div>
                <div className="text-xs text-gray-1 dark:text-gray-2 mt-1">Max Streak</div>
              </div>
              <div className="text-center p-3 bg-light-3 dark:bg-dark-4 rounded-xl">
                <div className="text-2xl font-bold text-blue-500">{stats?.activeDays || 0}</div>
                <div className="text-xs text-gray-1 dark:text-gray-2 mt-1">Active Days</div>
              </div>
            </div>
            {/* Activity heatmap (last 30 days) */}
            {stats?.activityMap && (
              <div>
                <h4 className="text-sm font-semibold text-gray-1 dark:text-gray-2 mb-2">Last 30 Days</h4>
                <div className="flex flex-wrap gap-1">
                  {Array.from({ length: 30 }, (_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - (29 - i));
                    const key = d.toISOString().slice(0, 10);
                    const count = stats.activityMap[key] || 0;
                    const intensity = count === 0 ? 'bg-light-4 dark:bg-dark-4'
                      : count <= 2 ? 'bg-green-200 dark:bg-green-900'
                        : count <= 5 ? 'bg-green-400 dark:bg-green-700'
                          : 'bg-green-600 dark:bg-green-500';
                    return (
                      <div
                        key={key}
                        className={`w-4 h-4 rounded-sm ${intensity}`}
                        title={`${key}: ${count} submissions`}
                      />
                    );
                  })}
                </div>
                <div className="flex items-center gap-1 mt-1.5 text-[10px] text-gray-400">
                  <span>Less</span>
                  <div className="w-3 h-3 rounded-sm bg-light-4 dark:bg-dark-4" />
                  <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-900" />
                  <div className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-700" />
                  <div className="w-3 h-3 rounded-sm bg-green-600 dark:bg-green-500" />
                  <span>More</span>
                </div>
              </div>
            )}
          </div>

          {/* Badges Card */}
          <div className="bg-light-2 dark:bg-dark-3 rounded-2xl shadow-lg p-6 card-hover border border-transparent hover:border-accent/20 animate-on-load animate-slide-up delay-400">
            <h3 className="text-lg font-bold text-dark-1 dark:text-light-1 mb-4">Achievements</h3>
            {(() => {
              const badges = [];
              if (totalSolved >= 1) badges.push({ icon: '🌱', name: 'First Solve', desc: 'Solved your first problem' });
              if (totalSolved >= 5) badges.push({ icon: '⚡', name: 'Quick Learner', desc: 'Solved 5 problems' });
              if (totalSolved >= 10) badges.push({ icon: '🔥', name: 'On Fire', desc: 'Solved 10 problems' });
              if (totalSolved >= 25) badges.push({ icon: '💎', name: 'Diamond', desc: 'Solved 25 problems' });
              if (solvedByDifficulty.Hard >= 1) badges.push({ icon: '🏔️', name: 'Mountain Climber', desc: 'Solved a Hard problem' });
              if (solvedByDifficulty.Hard >= 5) badges.push({ icon: '🏆', name: 'Champion', desc: 'Solved 5 Hard problems' });
              if (accuracy >= 80 && (stats?.totalSubmissions || 0) >= 5) badges.push({ icon: '🎯', name: 'Sharpshooter', desc: `${accuracy}% accuracy` });
              if (Object.keys(stats?.solvedCategories || {}).length >= 3) badges.push({ icon: '🌍', name: 'Explorer', desc: '3+ categories solved' });
              if ((stats?.currentStreak || 0) >= 3) badges.push({ icon: '🔥', name: 'Streak Master', desc: `${stats.currentStreak}-day streak!` });
              if ((stats?.currentStreak || 0) >= 7) badges.push({ icon: '💪', name: 'Week Warrior', desc: '7+ day streak' });
              if ((stats?.maxStreak || 0) >= 14) badges.push({ icon: '⭐', name: 'Consistency King', desc: '14+ day max streak' });

              return badges.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {badges.map((b, i) => (
                    <div key={i} className="flex flex-col items-center p-3 rounded-xl bg-light-3 dark:bg-dark-4 hover:ring-2 hover:ring-accent/40 transition-all" title={b.desc}>
                      <span className="text-3xl mb-1">{b.icon}</span>
                      <span className="text-xs font-medium text-dark-1 dark:text-light-1 text-center">{b.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-1 dark:text-gray-2">Solve your first problem to earn badges!</p>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}

/* Reusable progress bar */
function ProgressBar({ label, solved, total, color }) {
  const pct = total > 0 ? Math.round((solved / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 text-sm font-medium text-gray-1 dark:text-light-4">{label}</span>
      <div className="flex-grow h-3 bg-light-4 dark:bg-dark-4 rounded-full overflow-hidden">
        <div className={`${color} h-full rounded-full transition-all duration-700 ease-out`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-1 dark:text-gray-2 min-w-[40px] text-right">{solved}/{total}</span>
    </div>
  );
}

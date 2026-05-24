"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FiMinimize2, FiMaximize2 } from "react-icons/fi";

export default function DuoNav() {
    const { data: session } = useSession();
    const userID = session?.user?._id;
    const userEmail = session?.user?.email || '';
    const pathname = usePathname();
    const isProfilePage = pathname?.startsWith('/profile') || pathname?.startsWith('/edit-profile');
    const searchParams = useSearchParams();
    const activeLearnTab = searchParams?.get("tab") || "learn";

    const [theme, setTheme] = useState("light");
    const [isCompact, setIsCompact] = useState(false);
    const [userImage, setUserImage] = useState(null);

    useEffect(() => {
        if (userID) {
            fetch("/api/getUserInfo")
                .then(res => res.json())
                .then(data => {
                    if (data.image) setUserImage(data.image);
                })
                .catch(() => { });
        }
    }, [userID + (pathname || "")]); // Combined into a single string to maintain array size 1

    useEffect(() => {
        const savedTheme = localStorage.getItem("theme") || "light";
        setTheme(savedTheme);
        const savedCompact = localStorage.getItem("navCompact") === "true";
        setIsCompact(savedCompact);

        // Initialize nav height variable
        document.documentElement.style.setProperty('--nav-height', savedCompact ? '5.5vh' : '9vh');

        if (savedTheme === "dark") {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
        if (newTheme === "dark") {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    };

    const toggleCompact = () => {
        const newCompact = !isCompact;
        setIsCompact(newCompact);
        localStorage.setItem("navCompact", newCompact);
        document.documentElement.style.setProperty('--nav-height', newCompact ? '5.5vh' : '9vh');
    };

    return (
        <div id="duo-nav" className={isCompact ? "compact" : ""}>
            <Link href="/" className="duo-nav-logo">
                <img src="/coding.png" alt="cognicode" />
                <span>COGNI<span className="text-red-500">CODE</span></span>
            </Link>
            <div className="part-2">
                <h3><Link href={userID ? "/learn" : "/login"} className={(pathname?.startsWith("/learn") || pathname?.startsWith("/courses")) && activeLearnTab !== "prepare-test" ? "duo-nav-active" : ""}>LEARN</Link></h3>
                <h3><Link href={userID ? "/learn?tab=prepare-test" : "/login"} className={pathname?.startsWith("/learn") && activeLearnTab === "prepare-test" ? "duo-nav-active" : ""}>PREPARE &amp; TEST</Link></h3>
                <h3><Link href={userID ? "/problems" : "/login"} className={pathname?.startsWith("/problems") ? "duo-nav-active" : ""}>PROBLEMS</Link></h3>
            </div>
            <div className="duo-nav-icons">
                <button
                    onClick={toggleCompact}
                    className="duo-theme-btn text-dark-1 dark:text-light-1"
                    title={isCompact ? "Expand Navbar" : "Focus Mode (Shrink Navbar)"}
                >
                    {isCompact ? <FiMaximize2 size={16} /> : <FiMinimize2 size={16} />}
                </button>
                {!isProfilePage && (
                    <button onClick={toggleTheme} className="duo-theme-btn">
                        <img
                            src={theme === "light" ? "/dark-mode.png" : "/light-mode.png"}
                            alt="theme"
                        />
                    </button>
                )}
                <Link href={userID ? "/profile" : "/login"} className="duo-profile-btn">
                    {userID ? (
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-red-600 text-white flex items-center justify-center text-sm font-bold uppercase border border-light-4 dark:border-dark-4">
                            {userImage ? (
                                <img src={userImage} alt="Profile" className="w-full h-full object-cover no-invert" />
                            ) : (
                                userEmail.charAt(0)
                            )}
                        </div>
                    ) : (
                        <img src="/profile.png" alt="profile" />
                    )}
                </Link>
            </div>
        </div>
    );
}
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function DuoNav() {
    const { data: session } = useSession();
    const userID = session?.user?._id;
    const userEmail = session?.user?.email || '';
    const pathname = usePathname();

    const [theme, setTheme] = useState("light");

    useEffect(() => {
        const savedTheme = localStorage.getItem("theme") || "light";
        setTheme(savedTheme);
        // Apply dark class on initial load
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

    return (
        <div id="duo-nav">
            <Link href="/" className="duo-nav-logo">
                <img src="/coding.png" alt="cognicode" />
                <span>COGNI<span className="text-red-500">CODE</span></span>
            </Link>
            <div className="part-2">
                <h3><Link href={userID ? "/learn" : "/login"} className={pathname?.startsWith("/learn") || pathname?.startsWith("/courses") ? "duo-nav-active" : ""}>LEARN</Link></h3>
                <h3><Link href={userID ? "/problems" : "/login"} className={pathname?.startsWith("/problems") ? "duo-nav-active" : ""}>PROBLEMS</Link></h3>
            </div>
            <div className="duo-nav-icons">
                <button onClick={toggleTheme} className="duo-theme-btn">
                    <img
                        src={theme === "light" ? "/dark-mode.png" : "/light-mode.png"}
                        alt="theme"
                    />
                </button>
                <Link href={userID ? "/profile" : "/login"} className={`duo-profile-btn ${pathname?.startsWith("/profile") || pathname?.startsWith("/edit-profile") ? "duo-nav-profile-active" : ""}`}>
                    {userID ? (
                        <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center text-sm font-bold uppercase">
                            {userEmail.charAt(0)}
                        </div>
                    ) : (
                        <img src="/profile.png" alt="profile" />
                    )}
                </Link>
            </div>
        </div>
    );
}
"use client";

import { usePathname } from "next/navigation";
import DuoNav from "./DuoNav";
import ErrorBoundary from "./ErrorBoundary";

export default function LayoutShell({ children }) {
    const pathname = usePathname();
    const isHome = pathname === "/";

    return (
        <ErrorBoundary>
            <DuoNav />
            {isHome ? children : <div className="page-shell">{children}</div>}
        </ErrorBoundary>
    );
}

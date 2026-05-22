'use client'

import { SessionProvider } from "next-auth/react";

export default function Providers({ children }) {
    return (
        <SessionProvider basePath="/cognicode/api/auth">
            {children}
        </SessionProvider>
    );
}
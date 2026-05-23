import "./globals.css";
import "./duo-studio.css";
import Providers from "@/components/Providers";
import LayoutShell from "@/components/shared/LayoutShell";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "CogniCode — AI-Powered Coding Practice",
  description: "AI-powered coding practice platform with 100+ problems, instant code review, complexity analysis, and an AI tutor to help you master data structures and algorithms.",
  keywords: ["coding practice", "DSA", "algorithms", "data structures", "AI code review", "LeetCode alternative"],
  openGraph: {
    title: "CogniCode — AI-Powered Coding Practice",
    description: "Master DSA with AI-powered code review, complexity analysis, and an interactive AI tutor.",
    siteName: "CogniCode",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CogniCode — AI-Powered Coding Practice",
    description: "Master DSA with AI-powered code review, complexity analysis, and an interactive AI tutor.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark') document.documentElement.classList.add('dark');
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <Providers>
          <LayoutShell>{children}</LayoutShell>
        </Providers>
      </body>
    </html>
  );
}
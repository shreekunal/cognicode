import "./globals.css";
import "./duo-studio.css";
import Providers from "@/components/Providers";
import LayoutShell from "@/components/shared/LayoutShell";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Cognicode - Your Coding Ground",
  description: "Best Coding platform for all your needs",
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
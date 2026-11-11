import type { Metadata } from "next";
import { Inter, Syne, JetBrains_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/context/ThemeContext";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FitCore | Forge Your Core. Own Your Journey.",
  description: "Modern web-based fitness coaching platform connecting members with professional trainers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${syne.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('fitcore-theme');
                  var isDark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches) || !saved;
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                    document.documentElement.style.colorScheme = 'dark';
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                    document.documentElement.style.colorScheme = 'light';
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-text-primary selection:bg-primary/30 transition-colors duration-150">
        <ThemeProvider>
          {children}
          <Toaster 
            position="top-right" 
            gutter={8}
            toastOptions={{
              duration: 3500,
              className: 'fitcore-toast',
              style: {
                background: 'var(--bg-surface-elevated, #161822)',
                color: 'var(--text-main, #FFFFFF)',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                borderRadius: '16px',
                padding: '12px 18px',
                fontSize: '13.5px',
                fontWeight: '500',
                letterSpacing: '-0.01em',
                boxShadow: 'var(--card-shadow, 0 10px 30px -5px rgba(0, 0, 0, 0.5))',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                maxWidth: '420px',
              },
              success: {
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#FFFFFF',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#FFFFFF',
                },
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}

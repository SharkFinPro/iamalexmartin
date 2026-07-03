import { ReactNode } from "react";
import "@/styles/global.scss";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import AdminBar from "@/components/AdminBar";
import { isAuthed } from "@/lib/auth";
import { Analytics } from "@vercel/analytics/next";

import { config } from "@fortawesome/fontawesome-svg-core"
import "@fortawesome/fontawesome-svg-core/styles.css"
config.autoAddCss = false

import { Open_Sans, Space_Grotesk } from "next/font/google";
import { Metadata, Viewport } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const openSans = Open_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body"
})

// Display face for headings — a geometric grotesk that gives the site a
// distinct, more memorable voice than body Open Sans alone.
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700"],
  variable: "--font-display"
})

export const metadata: Metadata = {
  metadataBase: new URL("https://iamalexmartin.com"),
  title: {
    default: "Alex Martin's Portfolio",
    template: "%s | Alex Martin"
  },
  description: "Software developer with expertise in graphics programming, web performance optimization, and full-stack application development.",
  keywords: [
    "react",
    "nextjs",
    "portfolio",
    "full-stack developer",
    "interactive graphics",
    "C++ developer",
    "Vulkan programming",
    "GLSL shaders",
    "web development",
    "graphics programming",
    "real-time rendering",
    "visual simulations",
    "performance optimization"
  ],
  authors: [{ name: "Alexander Martin", url: "https://iamalexmartin.com" }],
  creator: "Alexander Martin",
  publisher: "Alexander Martin",
  robots: {
    index: true,
    follow: true
  }
};

// Browser-chrome color (mobile address bar etc.), forked per OS color scheme
// to match the theme backgrounds in _themes.scss. The in-page theme toggle
// doesn't rewrite this tag — it tracks the OS preference only.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f1ee" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1320" }
  ]
};

export default async function RootLayout({
  children
}: {
  children: ReactNode
}) {
  const admin = await isAuthed();

  return (
    <html lang="en" className={`${openSans.variable} ${spaceGrotesk.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('theme');
                  var theme;
                  if (saved === 'light' || saved === 'dark') {
                    theme = saved;
                  } else {
                    var prefersDark =
                      typeof window.matchMedia === 'function' &&
                      window.matchMedia('(prefers-color-scheme: dark)').matches;
                    theme = prefersDark ? 'dark' : 'light';
                  }
                  document.documentElement.setAttribute('data-theme', theme);
                  document.documentElement.style.colorScheme = theme;
                } catch (e) {
                  // If storage or matchMedia is unavailable, leave defaults in place
                }
              })();
            `,
          }}
        />
      </head>
      <body>
        <a href="#main-content" className="skipLink">Skip to main content</a>
        <NavBar />
        {children}
        <Footer />
        {admin && <AdminBar />}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
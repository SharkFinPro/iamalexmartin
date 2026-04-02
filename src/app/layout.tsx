import { ReactNode } from "react";
import "@/styles/global.scss";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

import { config } from "@fortawesome/fontawesome-svg-core"
import "@fortawesome/fontawesome-svg-core/styles.css"
config.autoAddCss = false

import { Open_Sans } from "next/font/google";
import { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const openSans = Open_Sans({
  subsets: ["latin"],
  display: "swap"
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

export default function RootLayout({
  children
}: {
  children: ReactNode
}) {
  return (
    <html lang="en" className={openSans.className} suppressHydrationWarning>
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
        <NavBar />
        {children}
        <Footer />
        <SpeedInsights />
      </body>
    </html>
  );
}
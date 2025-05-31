import { ReactNode } from "react";
import "@/styles/global.scss";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
config.autoAddCss = false

import { Open_Sans } from "next/font/google";

const openSans = Open_Sans({
  subsets: ["latin"],
  display: "swap"
})

export default function RootLayout({
  children
}: {
  children: ReactNode
}) {
  return (
    <html lang="en" className={openSans.className}>
      <body>
        <NavBar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
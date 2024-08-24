import { ReactNode } from "react";
import "@/styles/global.scss";
import NavBar from "@/components/NavBar";

export default function RootLayout({
  children
}: {
  children: ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <NavBar />
        {children}
      </body>
    </html>
  );
}
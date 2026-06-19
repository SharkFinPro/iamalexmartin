import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Banner from "@/components/Banner";
import { isAuthed } from "@/lib/auth";
import { getSiteConfig } from "@/lib/getSiteConfig";
import DashboardControls from "./DashboardControls";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

export default async function Page() {
  // Middleware guards this route; double-check here as the security boundary.
  if (!(await isAuthed())) {
    redirect("/admin/login");
  }

  const { data: config } = await getSiteConfig();

  return (
    <>
      <Banner title="Admin" description="Site-wide settings. Most content is edited inline on the page it lives on." />
      <DashboardControls config={config} />
    </>
  );
}

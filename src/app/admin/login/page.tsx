import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Banner from "@/components/Banner";
import { isAuthed } from "@/lib/auth";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Admin Login",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

export default async function Page() {
  if (await isAuthed()) {
    redirect("/");
  }

  return (
    <>
      <Banner title="Admin Login" description="Enter your admin key to enable editing." />
      <LoginForm />
    </>
  );
}

import Banner from "@/components/Banner";
import type { Metadata } from "next";

export const metadata : Metadata = {
  title: "Contact"
};

export default function Page() {
  return <>
    <Banner title={"Contact Me"} description={"Let's connect and discuss potential opportunities"} />
  </>
}
import Banner from "@/components/Banner";
import type { Metadata } from "next";

export const metadata : Metadata = {
  title: "Blog"
};

export default function Page() {
  return <>
    <Banner title={"Blog"} description={"Graphics programming insights, tutorials, and thoughts on technology"} />
  </>
}
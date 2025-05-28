"use client";
import { useParams } from "next/navigation";

export default function Page() {
  const params = useParams();

  const { slug } = params;

  return <>
    <h3>Hello, World!</h3>
    <p>{slug}</p>
  </>
}
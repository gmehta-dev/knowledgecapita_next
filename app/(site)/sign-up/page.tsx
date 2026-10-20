import type { Metadata } from "next";
import SignUp from "@/views/SignUp";

export const metadata: Metadata = { title: "Sign Up" };

export default function Page() {
  return <SignUp />;
}

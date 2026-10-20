import type { Metadata } from "next";
import Activities from "@/views/Activities";

export const metadata: Metadata = { title: "Activities" };

export default function Page() {
  return <Activities />;
}

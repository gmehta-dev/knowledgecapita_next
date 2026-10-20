import type { Metadata } from "next";
import Aboutus from "@/views/Aboutus";

export const metadata: Metadata = { title: "About Us" };

export default function Page() {
  return <Aboutus />;
}

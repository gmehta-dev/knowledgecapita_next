import type { Metadata } from "next";
import Aboutus from "@/views/Aboutus";

export const metadata: Metadata = { title: "About Us", alternates: { canonical: "/about-us" } };

export default function Page() {
  return <Aboutus />;
}

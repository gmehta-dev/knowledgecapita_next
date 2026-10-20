import type { Metadata } from "next";
import Contactus from "@/views/Contactus";

export const metadata: Metadata = { title: "Contact us" };

export default function Page() {
  return <Contactus />;
}

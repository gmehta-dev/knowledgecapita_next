import type { Metadata } from "next";
import Calender from "@/views/Calender";

export const metadata: Metadata = { title: "Calendar" };

export default function Page() {
  return <Calender />;
}

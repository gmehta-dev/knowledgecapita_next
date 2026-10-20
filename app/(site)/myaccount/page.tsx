import type { Metadata } from "next";
import MyAccount from "@/views/MyAccount";

export const metadata: Metadata = { title: "My Account" };

export default function Page() {
  return <MyAccount />;
}

import type { Metadata } from "next";
import AdminUsers from "@/views/AdminUsers";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default function Page() {
  return <AdminUsers />;
}

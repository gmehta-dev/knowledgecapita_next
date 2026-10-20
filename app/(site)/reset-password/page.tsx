import type { Metadata } from "next";
import ResetPassword from "@/views/ResetPassword";

export const metadata: Metadata = {
  title: "Reset Password",
  robots: { index: false, follow: false },
  // The token is in the URL: never send it to other sites in the Referer header.
  referrer: "no-referrer",
};

export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const { token } = await searchParams;
  return <ResetPassword token={typeof token === "string" ? token : ""} />;
}

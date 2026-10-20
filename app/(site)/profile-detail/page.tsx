import type { Metadata } from "next";
import { Suspense } from "react";
import ProfileDetail from "@/views/ProfileDetail";

export const metadata: Metadata = { title: "Profile" };

export default function Page() {
  // ProfileDetail reads ?pid= via useSearchParams, which needs a Suspense boundary.
  return (
    <Suspense>
      <ProfileDetail />
    </Suspense>
  );
}

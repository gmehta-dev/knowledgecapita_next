import type { Metadata } from "next";
import NotFoundPage from "@/views/NotFound";

export const metadata: Metadata = { title: "Page not found" };

// Rendered without Header/Footer, like the CRA catch-all route.
export default function NotFound() {
  return <NotFoundPage />;
}

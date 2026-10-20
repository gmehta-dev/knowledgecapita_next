import type { MetadataRoute } from "next";
import { getSitemapProfiles } from "@/server/profiles";
import { profilePath } from "@/lib/slug";
import { SITE_URL } from "@/lib/site";

// Built per request (cached by crawlers), so new and renamed profiles appear immediately.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const pages: MetadataRoute.Sitemap = [
        { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
        { url: `${SITE_URL}/about-us`, changeFrequency: "monthly", priority: 0.7 },
        { url: `${SITE_URL}/contact-us`, changeFrequency: "yearly", priority: 0.5 },
    ];

    try {
        const profiles = await getSitemapProfiles();
        for (const p of profiles) {
            pages.push({
                url: `${SITE_URL}${profilePath(p.id, p.name)}`,
                lastModified: p.updatedAt,
                changeFrequency: "weekly",
                priority: 0.8,
            });
        }
    } catch (error) {
        // Never fail the whole sitemap because the database is briefly unavailable.
        console.error("sitemap: could not load profiles", error);
    }

    return pages;
}

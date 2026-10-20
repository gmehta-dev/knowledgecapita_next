import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: "*",
            // Profile photos may appear in image search; the rest of the API and private pages may not.
            allow: ["/", "/api/storage/profile/"],
            disallow: ["/api/", "/admin/", "/myaccount", "/register", "/calender", "/reset-password"],
        },
        sitemap: `${SITE_URL}/sitemap.xml`,
        host: SITE_URL,
    };
}

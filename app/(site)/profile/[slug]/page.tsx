import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { cache } from "react";
import ProfileDetail from "@/views/ProfileDetail";
import { getProfileForPage } from "@/server/profiles";
import { profileIdFromSlug, profilePath } from "@/lib/slug";
import { SITE_NAME, SITE_URL } from "@/lib/site";

// Always read the latest profile from the database.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

// One DB lookup shared by generateMetadata and the page.
const loadProfile = cache(async (slug: string) => {
    const id = profileIdFromSlug(slug);
    return id ? { id, result: await getProfileForPage(id) } : null;
});

const stripHtml = (html?: string) =>
    (html || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

const photoUrl = (image?: string) => {
    if (!image) return undefined;
    // Stored as "<file>" (legacy) or "profile/<file>" (newer uploads).
    const file = image.replace(/^profile\//, "");
    return `${SITE_URL}/api/storage/profile/${encodeURIComponent(file)}`;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const loaded = await loadProfile(slug);
    if (!loaded?.result) return { title: "Profile not found", robots: { index: false } };

    const { profile, indexable } = loaded.result;
    const role = [profile.designation, profile.industry, profile.area_of_specialization].filter(Boolean).join(" · ");
    const bio = stripHtml(profile.brief_bio);
    const description = [`${profile.name}${role ? ` – ${role}` : ""}.`, bio].filter(Boolean).join(" ").slice(0, 160);
    const canonical = profilePath(loaded.id, profile.name);
    const image = photoUrl(profile.profile_image);

    return {
        title: role ? `${profile.name} – ${profile.designation || role}` : profile.name,
        description,
        alternates: { canonical },
        robots: indexable ? undefined : { index: false, follow: false },
        openGraph: {
            type: "profile",
            title: `${profile.name} | ${SITE_NAME}`,
            description,
            url: canonical,
            siteName: SITE_NAME,
            images: image ? [{ url: image, alt: profile.name }] : undefined,
        },
        twitter: { card: image ? "summary_large_image" : "summary", title: profile.name, description },
    };
}

export default async function ProfilePage({ params }: Props) {
    const { slug } = await params;
    const loaded = await loadProfile(slug);
    if (!loaded?.result) notFound();

    const { profile } = loaded.result;

    // Old or renamed slugs permanently redirect to the current canonical URL.
    const canonical = profilePath(loaded.id, profile.name);
    if (`/profile/${slug}` !== canonical) permanentRedirect(canonical);

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Person",
        name: profile.name,
        jobTitle: profile.designation || undefined,
        description: stripHtml(profile.brief_bio).slice(0, 300) || undefined,
        image: photoUrl(profile.profile_image),
        url: `${SITE_URL}${canonical}`,
        knowsAbout: profile.area_of_specialization || undefined,
    };

    return (
        <>
            <script
                type="application/ld+json"
                // JSON.stringify output with "<" escaped cannot break out of the script tag.
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
            />
            <ProfileDetail pid={loaded.id} initialData={profile} />
        </>
    );
}

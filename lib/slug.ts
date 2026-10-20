// SEO-friendly profile URLs: /profile/<name-slug>-<24-hex id>
// The id makes lookups exact; the slug is for people and search engines.

export function slugify(text: string): string {
    return (text || "")
        .normalize("NFKD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80)
        .replace(/-+$/g, "")
}

export function profilePath(id: string, name?: string): string {
    const slug = slugify(name || "")
    return `/profile/${slug ? `${slug}-` : ""}${id}`
}

/** Returns the ObjectId at the end of a profile slug, or null. */
export function profileIdFromSlug(slug: string): string | null {
    const match = /(?:^|-)([a-f0-9]{24})$/i.exec(slug || "")
    return match ? match[1].toLowerCase() : null
}

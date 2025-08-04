export class Slugger {
    private seen: Record<string, number> = {}

    /**
     * Slugify a string to be URL-safe and unique
     * @param text The input heading text
     * @returns A slug string
     */
    slug(text: string): string {
        // Normalize, lowercase, and replace unsafe characters
        const slug = text
            .toLowerCase()
            .normalize("NFKD") // Normalize accented characters
            .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
            .replace(/[^a-z0-9 _-]/g, "") // Remove non-alphanum except space/_/-
            .replace(/\s+/g, "-") // Replace spaces with hyphens
            .replace(/-+/g, "-") // Collapse multiple hyphens
            .replace(/^[-_]+|[-_]+$/g, "") // Trim hyphens or underscores

        // Ensure uniqueness
        const count = this.seen[slug] || 0
        this.seen[slug] = count + 1

        return count === 0 ? slug : `${slug}-${count}`
    }

    /**
     * Reset all previously seen slugs
     */
    reset() {
        this.seen = {}
    }
}

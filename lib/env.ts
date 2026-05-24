export function getSiteUrl(): string {
    const url = process.env.SITE_URL;
    if (!url) {
        throw new Error("SITE_URL env var is required");
    }
    
    return url;
}
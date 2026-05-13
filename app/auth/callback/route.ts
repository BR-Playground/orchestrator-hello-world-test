import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/";
    const SITE_URL = process.env.SITE_URL;

    if (!SITE_URL) {
        throw new Error("SITE_URL env var is required");
    }

    if (code) {
        const supabase = await createClient();

        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            return NextResponse.redirect(`${SITE_URL}${next}`)
        }
    }

    return NextResponse.redirect(`${SITE_URL}/login?error=${encodeURIComponent("OAuth sign-in failed.")}`);
}
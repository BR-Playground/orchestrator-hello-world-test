"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { projectSchema } from "./schema";
import { revalidatePath } from "next/cache";

export async function createProject(formData: FormData) {
    const supabase = await createClient();

    // extracts a user's ID from claims since it's not known at project creation
    const { data: claimsData } = await supabase.auth.getClaims();
    const userId = claimsData?.claims.sub;
    if (!userId) {
        redirect("/login");
    }

    const result = projectSchema.safeParse({
        name: formData.get("name"),
        description: formData.get("description") || undefined,
        status: formData.get("status"),
    });

    if (!result.success) {
        const message = result.error.issues[0]?.message ?? "Invalid input";
        redirect(`/projects/new?error=${encodeURIComponent(message)}`);
    }

    const { data, error } = await supabase.from("projects")
        .insert({ ...result.data, user_id: userId})
        .select("id")
        .single();

    if (error) {
        redirect(`/projects/new?error=${encodeURIComponent(error.message)}`);
    }

    revalidatePath("/projects");
    redirect(`/projects/${data.id}`);
}

export async function updateProject(formData: FormData) {
    const supabase = await createClient();

    const projectId = formData.get("id");
    if (typeof projectId !== "string" || !projectId) {
        redirect("/projects?error=Missing+project+ID");
    }

    const result = projectSchema.safeParse({
        name: formData.get("name"),
        description: formData.get("description") || undefined,
        status: formData.get("status"),
    });

    if (!result.success) {
        const message = result.error.issues[0]?.message ?? "Invalid input";
        redirect(`/projects/${projectId}/edit?error=${encodeURIComponent(message)}`);
    }

    const { error } = await supabase.from("projects")
        .update({
            ...result.data,
            updated_at: new Date().toISOString(),
        })
        .eq("id", projectId);
    
    if (error) {
        redirect(`/projects/${projectId}/edit?error=${encodeURIComponent(error.message)}`);
    }

    revalidatePath("/projects");
    revalidatePath(`/projects/${projectId}`);
    redirect(`/projects/${projectId}`);
}

export async function deleteProject(formData: FormData) {
    const supabase = await createClient();

    const projectId = formData.get("id");
    if (typeof projectId !== "string" || !projectId) {
        redirect("/projects?error=Missing+project+ID");
    }

    const { error } = await supabase.from("projects").delete().eq("id", projectId);
    if (error) {
        redirect(`/projects?error=${encodeURIComponent(error.message)}`);
    }

    revalidatePath("/projects");
    redirect(`/projects?message=${encodeURIComponent("Project deleted")}`);
}
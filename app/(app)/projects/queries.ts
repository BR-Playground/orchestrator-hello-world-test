import { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { cache } from "react";

export type Project = Database["public"]["Tables"]["projects"]["Row"];

export const getProject = cache(async (projectId: string): Promise<Project | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase.from("projects")
        .select("*")
        .eq("id", projectId)
        .maybeSingle();
    
    if (error) return null;

    return data;
});
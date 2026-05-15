"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { createProject } from "../actions";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type ProjectStatus = "draft" | "active" | "archived";

export function CreateProjectForm() {
    const searchParams = useSearchParams();
    const error = searchParams.get("error");
    const [projectStatus, setProjectStatus] = useState<ProjectStatus>("draft");

    return (
        <>
        {error && (
            <p className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
            </p>
        )}
        <form action={createProject} className="flex flex-col gap-6">
            <FieldGroup>
                <Field>
                    <FieldLabel htmlFor="name"> Name </FieldLabel>
                    <Input
                        id="name"
                        name="name"
                        required
                        maxLength={100}
                        placeholder="My new project"
                    />
                    <FieldDescription> 1 to 100 characters. </FieldDescription>
                </Field>

                <Field>
                    <FieldLabel htmlFor="description"> Description </FieldLabel>
                    <Textarea
                        id="description"
                        name="description"
                        maxLength={1000}
                        placeholder="What's this project about?"
                        rows={4}
                    />
                    <FieldDescription> Optional. Up to 1000 characters. </FieldDescription>
                </Field>

                <Field>
                    <FieldLabel htmlFor="status"> Status </FieldLabel>
                    <Select value={projectStatus} onValueChange={(v) => setProjectStatus(v as ProjectStatus)}>
                        <SelectTrigger id="status">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem value="draft"> Draft </SelectItem>
                                <SelectItem value="active"> Active </SelectItem>
                                <SelectItem value="archived"> Archived </SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <input type="hidden" name="status" value={projectStatus} />
                </Field>
            </FieldGroup>

            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" asChild>
                    <Link href="/projects"> Cancel </Link>
                </Button>
                <Button type="submit"> Create project </Button>
            </div>
        </form>
        </>
    );
}
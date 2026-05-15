"use client";

import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteProject } from "../actions";

export function DeleteProjectButton({ projectId, projectName} : {
    projectId: string,
    projectName: string
}) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive"> Delete </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle> Delete &ldquo;{projectName}&rdquo;? </AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete this project. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel> Cancel </AlertDialogCancel>
                    <form action={deleteProject}>
                        <input type="hidden" name="id" value={projectId} />
                        <Button type="submit" variant="destructive"> Delete </Button>
                    </form>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
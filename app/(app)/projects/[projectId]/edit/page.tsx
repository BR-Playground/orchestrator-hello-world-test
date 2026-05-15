import type { Metadata } from 'next';
import { getProject } from '../../queries';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { EditProjectForm } from './form';

export const metadata: Metadata = {
    title: "Edit project"
};

export default async function EditProjectPage({ params }: {
    params: Promise<{ projectId: string }>
}) {
    const { projectId } = await params;
    const project = await getProject(projectId);

    if (!project) {
        redirect(`/projects?error=${encodeURIComponent("Project not found")}`);
    }

    return (
        <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-8">
            <h1 className="text-3xl font-bold"> Edit project </h1>
            <Suspense>
                <EditProjectForm project={project}/>
            </Suspense>
        </main>
    );
}
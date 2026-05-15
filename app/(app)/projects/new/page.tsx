import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CreateProjectForm } from './form';

export const metadata: Metadata = {
    title: "New Project"
};

export default function NewProjectPage() {
    return (
        <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-8">
            <h1 className="text-3xl font-bold"> New project </h1>
            <Suspense>
                <CreateProjectForm />
            </Suspense>
        </main>
    );
}
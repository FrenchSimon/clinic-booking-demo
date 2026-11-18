import { Suspense } from "react";
import { NoteForm } from "@/features/notes/components/note-form";
import { NoteList } from "@/features/notes/components/note-list";

// Example feature. Routes stay thin: layout here, logic in src/features/notes.
export default function NotesPage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-6 md:py-10">
      <h1 className="font-semibold text-2xl">Notes</h1>
      <NoteForm />
      <Suspense
        fallback={<p className="text-muted-foreground text-sm">Loading…</p>}
      >
        <NoteList />
      </Suspense>
    </main>
  );
}

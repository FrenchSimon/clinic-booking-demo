import { requireUser } from "@/server/auth";
import { listNotes } from "../queries";

export async function NoteList() {
  const user = await requireUser();
  const notes = await listNotes(user.id);

  if (notes.length === 0) {
    return <p className="text-muted-foreground text-sm">No notes yet.</p>;
  }

  return (
    <ul className="flex flex-col divide-y rounded-lg border">
      {notes.map((note) => (
        <li key={note.id} className="px-4 py-3 text-sm">
          {note.body}
        </li>
      ))}
    </ul>
  );
}

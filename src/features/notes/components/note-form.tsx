"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createNote } from "../actions";
import { type NoteInput, noteInput } from "../schema";

export function NoteForm() {
  const [pending, startTransition] = useTransition();
  const form = useForm<NoteInput>({
    resolver: zodResolver(noteInput),
    defaultValues: { body: "" },
  });
  const error = form.formState.errors.body?.message;

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = await createNote(values);
      if (result.ok) form.reset();
      else form.setError("body", { message: result.error });
    }),
  );

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-2 sm:flex-row sm:items-end"
      noValidate
    >
      <div className="flex flex-1 flex-col gap-1.5">
        <Label htmlFor="note-body">New note</Label>
        <Input
          id="note-body"
          autoComplete="off"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "note-body-error" : undefined}
          className="min-h-11"
          {...form.register("body")}
        />
        {error && (
          <p id="note-body-error" className="text-destructive text-sm">
            {error}
          </p>
        )}
      </div>
      <Button
        type="submit"
        disabled={pending}
        className="min-h-11 w-full sm:w-auto"
      >
        {pending ? "Saving…" : "Add"}
      </Button>
    </form>
  );
}

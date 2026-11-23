"use client";

type Props = {
  physios: { id: string; name: string }[];
  picked: string[];
  onChange: (picked: string[]) => void;
  error?: string;
  legend: string;
  empty: string;
};

/** One checkbox per physio of the clinic: who offers this session. */
export function PhysioChoices({
  physios,
  picked,
  onChange,
  error,
  legend,
  empty,
}: Props) {
  const toggle = (id: string, on: boolean) =>
    onChange(on ? [...picked, id] : picked.filter((p) => p !== id));

  return (
    <fieldset
      className="flex flex-col gap-1"
      aria-describedby={error ? "physios-error" : undefined}
    >
      <legend className="mb-1 font-medium text-sm">{legend}</legend>
      {physios.length === 0 ? (
        <p className="text-muted-foreground text-sm">{empty}</p>
      ) : (
        physios.map((p) => (
          <label key={p.id} className="flex min-h-11 items-center gap-3">
            <input
              type="checkbox"
              name="practitionerIds"
              value={p.id}
              checked={picked.includes(p.id)}
              onChange={(e) => toggle(p.id, e.target.checked)}
              className="size-5 accent-primary"
            />
            {p.name}
          </label>
        ))
      )}
      {error && (
        <p id="physios-error" className="text-destructive text-sm">
          {error}
        </p>
      )}
    </fieldset>
  );
}

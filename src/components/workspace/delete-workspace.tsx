"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteWorkspace } from "@/app/actions/workspace";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";

export function DeleteWorkspace({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const toast = useToast();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <details className="rounded-2xl border border-unexcused/30 bg-surface p-4">
      <summary className="min-h-11 cursor-pointer py-2 font-medium text-unexcused">Izbriši šolo</summary>
      <div className="mt-2 flex flex-col gap-3">
        <p className="text-sm text-ink-soft">
          Izbrišejo se vsi učenci, termini in zabeležene ure te šole. Tega ni mogoče razveljaviti.
        </p>
        <Field label={`Za potrditev vpišite »${name}«`} htmlFor="del-ws">
          <input id="del-ws" value={value} onChange={(e) => setValue(e.target.value)} autoComplete="off" className={inputClass} />
        </Field>
        <Button
          variant="danger"
          disabled={busy || value.trim() !== name}
          onClick={async () => {
            setBusy(true);
            const r = await deleteWorkspace(id, value);
            setBusy(false);
            if (!r.ok) return toast({ message: r.error, tone: "error" });
            toast({ message: `Šola »${name}« je izbrisana.` });
            router.push("/");
          }}
        >
          <Trash2 className="size-4" aria-hidden /> Izbriši šolo
        </Button>
      </div>
    </details>
  );
}

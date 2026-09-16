import type { FormEvent } from "react";

type DemoValue = string | number;

function setFormValues(form: HTMLFormElement | null, values: Record<string, DemoValue>) {
  if (!form) return;
  for (const [name, value] of Object.entries(values)) {
    const field = form.elements.namedItem(name);
    if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement) {
      field.value = String(value);
    }
  }
}

export function DemoFillButton({ values, label = "Cargar caso demo" }: { values: Record<string, DemoValue>; label?: string }) {
  function fill(event: FormEvent<HTMLButtonElement>) {
    setFormValues(event.currentTarget.form, values);
  }

  return <button type="button" className="demo-button" onClick={fill}>✦ {label}</button>;
}

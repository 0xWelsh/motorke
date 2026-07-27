"use client";
import { useModal } from "@/components/Modal";
import { Trash2 } from "lucide-react";
import { clsx } from "clsx";

export default function DeleteButton({
  action,
  label = "Delete",
  message = "Are you sure? This cannot be undone.",
  compact = false,
}) {
  const { danger } = useModal();

  async function handleClick() {
    const confirmed = await danger(message, {
      title: label,
      confirmLabel: "Yes, delete",
    });
    if (!confirmed) return;

    const form = document.createElement("form");
    form.method = "POST";
    form.action = action;
    document.body.appendChild(form);
    form.submit();
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleClick}
        title={label}
        aria-label={label}
        className="rounded-xl border border-rose-900/70 bg-rose-950/50 p-2.5 text-rose-400 transition hover:border-rose-400 hover:bg-rose-950"
      >
        <Trash2 size={16} strokeWidth={2.25} aria-hidden />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={clsx(
        "rounded-2xl border border-rose-100 bg-rose-50 px-6 py-3 text-[11px] font-black uppercase tracking-widest text-rose-600 shadow-sm transition-all hover:bg-rose-100 active:scale-95",
      )}
    >
      {label}
    </button>
  );
}

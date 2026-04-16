"use client";
import { useModal } from "@/components/Modal";

export default function DeleteButton({ action, label = "Delete", message = "Are you sure? This cannot be undone." }) {
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

  return (
    <button
      type="button"
      onClick={handleClick}
      className="bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-none border border-rose-100 transition-all active:scale-95 shadow-sm"
    >
      {label}
    </button>
  );
}
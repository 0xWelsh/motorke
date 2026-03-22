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
    <button type="button" onClick={handleClick} style={{
      fontSize: 12, border: "1px solid #fecaca", borderRadius: 7,
      padding: "4px 10px", color: "#dc2626", background: "#fef2f2",
      cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
    }}>
      {label}
    </button>
  );
}
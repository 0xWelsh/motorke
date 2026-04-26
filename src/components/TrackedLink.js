"use client";

import Link from "next/link";
import { trackUiEvent } from "@/lib/analytics";

export default function TrackedLink({ eventName, eventPayload, onClick, ...props }) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        if (eventName) {
          trackUiEvent(eventName, eventPayload);
        }
        onClick?.(event);
      }}
    />
  );
}

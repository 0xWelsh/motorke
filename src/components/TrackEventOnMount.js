"use client";

import { useEffect } from "react";
import { trackUiEvent } from "@/lib/analytics";

export default function TrackEventOnMount({ name, payload = {} }) {
  useEffect(() => {
    if (!name) return;
    trackUiEvent(name, payload);
  }, [name, payload]);

  return null;
}

// src/hooks/use-client-session.js
// Client-side auth detection so server pages can stay static/cacheable
// instead of reading the session cookie on every request.
"use client";

import { useEffect, useState } from "react";

export function useClientSession() {
  const [state, setState] = useState({
    loading: true,
    user: null,
  });

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        setState({ loading: false, user: data?.user || null });
      })
      .catch(() => {
        if (!active) return;
        setState({ loading: false, user: null });
      });
    return () => {
      active = false;
    };
  }, []);

  return state;
}
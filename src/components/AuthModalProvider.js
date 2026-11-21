"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AuthModal from "@/components/AuthModal";

const AuthModalCtx = createContext({ openAuthModal: () => {} });

export function useAuthModal() {
  return useContext(AuthModalCtx);
}

/**
 * Global auth overlay (Cars & Bids style): Login/Register never leave the
 * page you are on. Direct /login and /signup routes still work for emails,
 * OAuth callbacks, and cold URLs — those render the same forms as pages.
 */
export function AuthModalProvider({ children }) {
  const [state, setState] = useState(null); // { mode: "login" | "signup", next?: string }
  const pathname = usePathname();

  const openAuthModal = useCallback((mode = "login", opts = {}) => {
    setState({ mode, next: opts.next });
  }, []);

  const close = useCallback(() => setState(null), []);

  // Any navigation (login redirect, signup window.location, user clicking
  // around) closes the overlay automatically.
  useEffect(() => {
    close();
  }, [pathname, close]);

  return (
    <AuthModalCtx.Provider value={{ openAuthModal }}>
      {children}
      <AuthModal state={state} onClose={close} />
    </AuthModalCtx.Provider>
  );
}

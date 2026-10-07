"use client";

import { createContext, useContext, useEffect, useState } from "react";

const SAVE_DATA_COOKIE = "wmh-save-data";

const SaveDataContext = createContext(false);

export function SaveDataProvider({ children }) {
  // Resolved client-side so the root layout never reads cookies()/headers()
  // (which would disable ISR/HTML caching on every public page).
  const [saveData, setSaveData] = useState(false);

  useEffect(() => {
    try {
      const fromCookie = document.cookie.includes(`${SAVE_DATA_COOKIE}=1`);
      const nav =
        typeof navigator !== "undefined" && navigator.connection &&
        navigator.connection.saveData === true;
      if (fromCookie || nav) setSaveData(true);
    } catch {
      // best effort
    }
  }, []);

  return <SaveDataContext.Provider value={Boolean(saveData)}>{children}</SaveDataContext.Provider>;
}

export function useSaveData() {
  return useContext(SaveDataContext);
}
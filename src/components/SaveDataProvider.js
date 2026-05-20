"use client";

import { createContext, useContext } from "react";

const SaveDataContext = createContext(false);

export function SaveDataProvider({ saveData = false, children }) {
  return <SaveDataContext.Provider value={Boolean(saveData)}>{children}</SaveDataContext.Provider>;
}

export function useSaveData() {
  return useContext(SaveDataContext);
}

"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

interface VaultSessionContextValue {
  vaultKey: CryptoKey | null;
  setVaultKey: (key: CryptoKey | null) => void;
  clearVaultKey: () => void;
}

const VaultSessionContext = createContext<VaultSessionContextValue | null>(
  null,
);

export function VaultSessionProvider({ children }: { children: ReactNode }) {
  const [vaultKey, setVaultKeyState] = useState<CryptoKey | null>(null);

  const setVaultKey = useCallback(
    (key: CryptoKey | null) => setVaultKeyState(key),
    [],
  );
  const clearVaultKey = useCallback(() => setVaultKeyState(null), []);

  return (
    <VaultSessionContext.Provider
      value={{ vaultKey, setVaultKey, clearVaultKey }}
    >
      {children}
    </VaultSessionContext.Provider>
  );
}

export function useVaultSession() {
  const ctx = useContext(VaultSessionContext);
  if (!ctx) {
    throw new Error("useVaultSession must be used within VaultSessionProvider");
  }
  return ctx;
}

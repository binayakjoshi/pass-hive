"use client";

import { useEffect, useState, useCallback } from "react";
import { useVaultSession } from "@/context/vault-session";
import { fetchVaultItems, decryptVaultItem } from "@/lib/vault-item";
import { VaultItemDecrypted } from "@/types/vault";

export function useVaultItems() {
  const { vaultKey, clearVaultKey } = useVaultSession();
  const [items, setItems] = useState<VaultItemDecrypted[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!vaultKey) {
      setItems([]); // clear anything decrypted from a previous unlock
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const encrypted = await fetchVaultItems();

      // allSettled, not all — one corrupted/undecryptable item shouldn't
      // take down the whole list.
      const results = await Promise.allSettled(
        encrypted.map((item) => decryptVaultItem(item, vaultKey)),
      );

      const decrypted = results
        .filter(
          (r): r is PromiseFulfilledResult<VaultItemDecrypted> =>
            r.status === "fulfilled",
        )
        .map((r) => r.value);

      setItems(decrypted);

      const failedCount = results.length - decrypted.length;
      if (failedCount > 0) {
        console.warn(`${failedCount} vault item(s) failed to decrypt`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load vault");
    } finally {
      setIsLoading(false);
    }
  }, [vaultKey]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { items, isLoading, error, locked: !vaultKey, reload };
}

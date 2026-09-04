"use client";

import { useEffect, useState, useCallback } from "react";
import { useVaultSession } from "@/context/vault-session";
import { fetchVaultItems, decryptVaultItem } from "@/lib/vault-item";
import { VaultItemDecrypted } from "@/types/vault";

export function useVaultItems() {
  const { vaultKey } = useVaultSession();
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
  const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  const toggleFavorite = useCallback(async (item: VaultItemDecrypted) => {
    const nextFavorite = !item.favorite;

    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, favorite: nextFavorite } : i,
      ),
    );

    try {
      const res = await fetch(`${API_URL}/vaults/items/${item.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorite: nextFavorite }),
      });
      if (!res.ok) throw new Error("Failed to update favorite");
    } catch (err) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, favorite: item.favorite } : i,
        ),
      );
      throw err;
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);
  return { items, isLoading, error, locked: !vaultKey, reload, toggleFavorite };
}

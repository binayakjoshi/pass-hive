import { VaultItemDecrypted, VaultItemEncrypted } from "@/types/vault";
import { decryptField } from "./crypto";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

export async function fetchVaultItems(): Promise<VaultItemEncrypted[]> {
  const res = await fetch(`${API_URL}/vaults/items`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to load vault items");
  return res.json();
}

export async function decryptVaultItem(
  item: VaultItemEncrypted,
  vaultKey: CryptoKey,
): Promise<VaultItemDecrypted> {
  const title = await decryptField(
    item.encrypted_title,
    item.title_iv,
    vaultKey,
  );
  const dataJson = await decryptField(
    item.encrypted_data,
    item.data_iv,
    vaultKey,
  );

  return {
    id: item.id,
    vault_id: item.vault_id,
    type: item.type,
    title,
    data: JSON.parse(dataJson),
    favorite: item.favorite,
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
}

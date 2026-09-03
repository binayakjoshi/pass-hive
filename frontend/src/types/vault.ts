export type VaultItemType = "login" | "card" | "note" | "identity" | "ssh_key";

export interface VaultItemEncrypted {
  id: string;
  type: VaultItemType;
  encrypted_title: string;
  title_iv: string;
  encrypted_data: string;
  data_iv: string;
  favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface VaultItemDecrypted {
  id: string;
  type: VaultItemType;
  title: string;
  data: Record<string, unknown>;
  favorite: boolean;
}

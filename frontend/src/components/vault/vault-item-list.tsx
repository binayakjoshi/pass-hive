"use client";

import {
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Typography,
  CircularProgress,
  Alert,
  Box,
  Fab,
  Button,
} from "@mui/material";
import {
  VpnKey,
  CreditCard,
  StickyNote2,
  Badge,
  Terminal,
  Star,
  Add,
  LockOutlined,
  ChevronRight,
} from "@mui/icons-material";
import { useEffect, useState, type ReactNode } from "react";

import { useVaultItems } from "@/hooks/use-vault-item";
import { VaultItemDecrypted, VaultItemType } from "@/types/vault";
import AddItemModal from "./add-vault-item";
import UnlockVaultModal from "./unlock-vault-model";
import VaultItemDetailModal from "./vault-item-detail-modal";
import DeleteItemConfirm from "./delete-vault-item-modal";

const TYPE_ICON: Record<VaultItemType, ReactNode> = {
  login: <VpnKey fontSize="small" />,
  card: <CreditCard fontSize="small" />,
  note: <StickyNote2 fontSize="small" />,
  identity: <Badge fontSize="small" />,
  ssh_key: <Terminal fontSize="small" />,
};

const TYPE_LABEL: Record<VaultItemType, string> = {
  login: "Login",
  card: "Card",
  note: "Note",
  identity: "Identity",
  ssh_key: "SSH Key",
};

function itemSubtitle(item: VaultItemDecrypted): string {
  switch (item.type) {
    case "login":
      return (item.data.username as string) ?? (item.data.url as string) ?? "";
    case "card":
      return (item.data.last4 as string) ? `•••• ${item.data.last4}` : "";
    case "identity":
      return (item.data.email as string) ?? "";
    case "ssh_key":
      return (item.data.host as string) ?? "";
    default:
      return "";
  }
}

export default function VaultItemList() {
  const { items, isLoading, error, locked, reload } = useVaultItems();
  const [modalOpen, setModalOpen] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(locked);

  const [selectedItem, setSelectedItem] = useState<VaultItemDecrypted | null>(
    null,
  );
  const [editingItem, setEditingItem] = useState<VaultItemDecrypted | null>(
    null,
  );

  // Item pending delete confirmation — separate from selectedItem so the
  // detail modal can close while the confirm dialog takes over.
  const [deleteTarget, setDeleteTarget] = useState<VaultItemDecrypted | null>(
    null,
  );

  useEffect(() => {
    if (locked) setUnlockOpen(true);
  }, [locked]);

  if (locked) {
    return (
      <>
        <Box sx={{ textAlign: "center", py: 6 }}>
          <LockOutlined sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Your vault is locked.
          </Typography>
          <Button variant="contained" onClick={() => setUnlockOpen(true)}>
            Unlock Vault
          </Button>
        </Box>
        <UnlockVaultModal
          open={unlockOpen}
          onClose={() => setUnlockOpen(false)}
        />
      </>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }
  if (items.length === 0) {
    return (
      <Box
        sx={{
          textAlign: "center",
          py: 6,
        }}
      >
        <Typography color="text.secondary">
          No items yet — add your first one.
        </Typography>

        <Fab
          color="primary"
          onClick={() => setModalOpen(true)}
          sx={{ position: "fixed", bottom: 24, right: 24 }}
        >
          <Add />
        </Fab>

        <AddItemModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onCreated={reload}
        />
      </Box>
    );
  }

  return (
    <>
      <List sx={{ width: "100%" }}>
        {items.map((item) => (
          <ListItemButton
            key={item.id}
            divider
            sx={{ borderRadius: 1.5, mb: 0.5 }}
            onClick={() => setSelectedItem(item)}
          >
            <ListItemAvatar>
              <Avatar
                sx={{ bgcolor: "action.selected", color: "text.primary" }}
              >
                {TYPE_ICON[item.type]}
              </Avatar>
            </ListItemAvatar>
            <ListItemText primary={item.title} secondary={itemSubtitle(item)} />
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              {item.favorite && <Star fontSize="small" color="warning" />}
              <Chip
                label={TYPE_LABEL[item.type]}
                size="small"
                variant="outlined"
              />
              <ChevronRight
                fontSize="small"
                sx={{ color: "text.disabled", ml: 0.5 }}
              />
            </Box>
          </ListItemButton>
        ))}
      </List>
      <Fab
        color="primary"
        onClick={() => setModalOpen(true)}
        sx={{ position: "fixed", bottom: 24, right: 24 }}
      >
        <Add />
      </Fab>

      <VaultItemDetailModal
        open={!!selectedItem}
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onEdit={(item) => {
          setSelectedItem(null);
          setEditingItem(item);
        }}
        onDeleteRequest={(item) => {
          setSelectedItem(null);
          setDeleteTarget(item);
        }}
      />

      <AddItemModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={reload}
      />
      <AddItemModal
        open={!!editingItem}
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onCreated={reload}
      />
      <DeleteItemConfirm
        open={!!deleteTarget}
        item={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={reload}
      />
    </>
  );
}

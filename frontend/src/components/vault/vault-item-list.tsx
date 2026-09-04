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
  IconButton,
  TextField,
  MenuItem,
  InputAdornment,
} from "@mui/material";
import {
  VpnKey,
  CreditCard,
  StickyNote2,
  Badge,
  Terminal,
  Add,
  LockOutlined,
  ChevronRight,
  Star,
  StarBorder,
  Search,
} from "@mui/icons-material";
import { useEffect, useMemo, useState, type ReactNode } from "react";

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

const TYPE_FILTER_OPTIONS: { value: VaultItemType | "all"; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "login", label: "Login" },
  { value: "card", label: "Card" },
  { value: "note", label: "Note" },
  { value: "identity", label: "Identity" },
  { value: "ssh_key", label: "SSH Key" },
];

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
  const { items, isLoading, error, locked, reload, toggleFavorite } =
    useVaultItems();

  const [modalOpen, setModalOpen] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(locked);
  const [typeFilter, setTypeFilter] = useState<VaultItemType | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedItem, setSelectedItem] = useState<VaultItemDecrypted | null>(
    null,
  );
  const [editingItem, setEditingItem] = useState<VaultItemDecrypted | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<VaultItemDecrypted | null>(
    null,
  );

  // derived, client-side only — items are already decrypted in memory,
  // no reload/re-decrypt needed when these change
  const visibleItems = useMemo(() => {
    let result = items;

    if (typeFilter !== "all") {
      result = result.filter((i) => i.type === typeFilter);
    }

    const term = searchTerm.trim().toLowerCase();
    if (term) {
      result = result.filter((i) => i.title.toLowerCase().includes(term));
    }

    // favorites first, stable order otherwise
    return [...result].sort((a, b) => Number(b.favorite) - Number(a.favorite));
  }, [items, typeFilter, searchTerm]);

  const handleToggleFavorite = async (item: VaultItemDecrypted) => {
    await toggleFavorite(item);
    setSelectedItem((prev) =>
      prev && prev.id === item.id
        ? { ...prev, favorite: !prev.favorite }
        : prev,
    );
  };

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

  // empty vault vs. empty filter result are different states —
  // only show the "add your first item" CTA when there are truly no items
  if (items.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 6 }}>
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
      <Box sx={{ display: "flex", gap: 1.5, mb: 2, flexWrap: "wrap" }}>
        <TextField
          size="small"
          placeholder="Search by title"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ flexGrow: 1, minWidth: 200 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" sx={{ color: "text.disabled" }} />
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          size="small"
          select
          value={typeFilter}
          onChange={(e) =>
            setTypeFilter(e.target.value as VaultItemType | "all")
          }
          sx={{ minWidth: 140 }}
        >
          {TYPE_FILTER_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {visibleItems.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <Typography color="text.secondary">
            No items match your filters.
          </Typography>
        </Box>
      ) : (
        <List sx={{ width: "100%" }}>
          {visibleItems.map((item) => (
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
              <ListItemText
                primary={item.title}
                secondary={itemSubtitle(item)}
              />
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(item);
                  }}
                >
                  {item.favorite ? (
                    <Star fontSize="small" color="warning" />
                  ) : (
                    <StarBorder
                      fontSize="small"
                      sx={{ color: "text.disabled" }}
                    />
                  )}
                </IconButton>
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
      )}

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
        onToggleFavorite={handleToggleFavorite}
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

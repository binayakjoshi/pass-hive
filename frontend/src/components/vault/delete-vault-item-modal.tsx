"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
} from "@mui/material";
import { VaultItemDecrypted } from "@/types/vault";

interface Props {
  open: boolean;
  item: VaultItemDecrypted | null;
  onClose: () => void;
  onDeleted: () => void; // parent calls reload()
}

export default function DeleteItemConfirm({
  open,
  item,
  onClose,
  onDeleted,
}: Props) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  if (!item) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/vaults/items/${item.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete item");
      onDeleted();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete item");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={isDeleting ? undefined : onClose}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>Delete "{item.title}"?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          This item will be removed from your vault. This action can't be undone
          from the app.
        </DialogContentText>
        {error && (
          <DialogContentText color="error" sx={{ mt: 1 }}>
            {error}
          </DialogContentText>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} disabled={isDeleting} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleDelete}
          disabled={isDeleting}
          color="error"
          variant="contained"
        >
          {isDeleting ? (
            <CircularProgress size={22} color="inherit" />
          ) : (
            "Delete"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

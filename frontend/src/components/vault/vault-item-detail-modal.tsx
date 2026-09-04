"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Box,
  Stack,
  Tooltip,
  Snackbar,
  Chip,
  Avatar,
  Paper,
  Divider,
} from "@mui/material";
import {
  ContentCopy,
  Visibility,
  VisibilityOff,
  Edit,
  Delete,
  VpnKey,
  CreditCard,
  StickyNote2,
  Badge,
  Terminal,
  Star,
  StarBorder,
} from "@mui/icons-material";
import { VaultItemDecrypted, VaultItemType } from "@/types/vault";
import { copyToClipboard } from "@/lib/clipboard";

const SENSITIVE_FIELDS = new Set(["password", "private_key", "cvv", "pin"]);

const TYPE_ICON: Record<VaultItemType, React.ReactNode> = {
  login: <VpnKey />,
  card: <CreditCard />,
  note: <StickyNote2 />,
  identity: <Badge />,
  ssh_key: <Terminal />,
};

const TYPE_LABEL: Record<VaultItemType, string> = {
  login: "Login",
  card: "Card",
  note: "Note",
  identity: "Identity",
  ssh_key: "SSH Key",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

interface Props {
  open: boolean;
  item: VaultItemDecrypted | null;
  onClose: () => void;
  onEdit: (item: VaultItemDecrypted) => void;
  onDeleteRequest: (item: VaultItemDecrypted) => void;
  onToggleFavorite: (item: VaultItemDecrypted) => void; // new
}
export default function VaultItemDetailModal({
  open,
  item,
  onClose,
  onEdit,
  onDeleteRequest,
  onToggleFavorite,
}: Props) {
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [copiedMsg, setCopiedMsg] = useState<string | null>(null);

  if (!item) return null;

  const toggleReveal = (key: string) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleCopy = async (label: string, value: string) => {
    const ok = await copyToClipboard(value);
    setCopiedMsg(ok ? `${label} copied` : "Copy failed");
  };

  const fields = Object.entries(item.data).filter(
    ([, v]) => v !== "" && v != null,
  );

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        {/* Header */}
        <DialogTitle sx={{ pb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar
              sx={{
                bgcolor: "primary.main",
                color: "primary.contrastText",
                width: 44,
                height: 44,
              }}
            >
              {TYPE_ICON[item.type]}
            </Avatar>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="h6" noWrap>
                {item.title}
              </Typography>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.25 }}
              >
                <Chip label={TYPE_LABEL[item.type]} size="small" />
                <Tooltip
                  title={
                    item.favorite ? "Remove from favorites" : "Add to favorites"
                  }
                >
                  <IconButton
                    size="small"
                    onClick={() => onToggleFavorite(item)}
                    sx={{ p: 0.25 }}
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
                </Tooltip>
              </Box>
            </Box>
          </Box>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={1.5}>
            {fields.map(([key, rawValue]) => {
              const value = String(rawValue);
              const isSensitive = SENSITIVE_FIELDS.has(key);
              const isMasked = isSensitive && !revealed.has(key);

              return (
                <Paper
                  key={key}
                  variant="outlined"
                  sx={{
                    px: 2,
                    py: 1.25,
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                >
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ textTransform: "capitalize", display: "block" }}
                    >
                      {key.replace(/_/g, " ")}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        fontFamily: isSensitive ? "monospace" : undefined,
                        wordBreak: "break-all",
                      }}
                    >
                      {isMasked
                        ? "•".repeat(Math.min(value.length, 16))
                        : value}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", flexShrink: 0 }}>
                    {isSensitive && (
                      <Tooltip title={isMasked ? "Reveal" : "Hide"}>
                        <IconButton
                          size="small"
                          onClick={() => toggleReveal(key)}
                        >
                          {isMasked ? (
                            <Visibility fontSize="small" />
                          ) : (
                            <VisibilityOff fontSize="small" />
                          )}
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Copy">
                      <IconButton
                        size="small"
                        onClick={() => handleCopy(key, value)}
                      >
                        <ContentCopy fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Paper>
              );
            })}
          </Stack>

          {/* Timestamps */}
          <Box
            sx={{
              mt: 3,
              pt: 2,
              borderTop: "1px solid",
              borderColor: "divider",
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <Typography variant="caption" color="text.disabled">
              Created {formatDate(item.created_at)}
            </Typography>
            <Typography variant="caption" color="text.disabled">
              Updated {formatDate(item.updated_at)}
            </Typography>
          </Box>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            color="error"
            startIcon={<Delete />}
            onClick={() => onDeleteRequest(item)}
          >
            Delete
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button onClick={onClose} color="inherit">
            Close
          </Button>
          <Button
            variant="contained"
            startIcon={<Edit />}
            onClick={() => onEdit(item)}
          >
            Edit
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!copiedMsg}
        autoHideDuration={1500}
        onClose={() => setCopiedMsg(null)}
        message={copiedMsg}
      />
    </>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  CircularProgress,
  Typography,
  Box,
} from "@mui/material";
import { Visibility, VisibilityOff, LockOutlined } from "@mui/icons-material";
import { useVaultSession } from "@/context/vault-session";
import { useUser } from "@/context/user-context";
import { deriveMasterKey, unwrapVaultKey } from "@/lib/crypto";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function UnlockVaultModal({ open, onClose }: Props) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const { setVaultKey } = useVaultSession();
  const { user } = useUser();
  const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  const handleUnlock = async (e: FormEvent) => {
    e.preventDefault();
    if (!password || !user?.email) return;

    setLocalError(null);
    setIsLoading(true);

    try {
      const vaultRes = await fetch(`${API_URL}/vaults/current`, {
        credentials: "include",
      });
      if (!vaultRes.ok) {
        throw new Error("Could not reach the server");
      }
      const { encrypted_vault_key, vault_key_iv } = await vaultRes.json();

      const masterKey = await deriveMasterKey(password, user.email);
      // If the password is wrong, the AES-GCM auth tag check inside
      // unwrapVaultKey fails and throws — that's our "wrong password" signal.
      const vaultKey = await unwrapVaultKey(
        encrypted_vault_key,
        vault_key_iv,
        masterKey,
      );

      setVaultKey(vaultKey);
      setPassword("");
      onClose();
    } catch (err) {
      if (
        err instanceof Error &&
        err.message === "Could not reach the server"
      ) {
        setLocalError("Could not reach the server. Try again.");
      } else {
        setLocalError("Incorrect master password. Try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={isLoading ? undefined : onClose}
      maxWidth="xs"
      fullWidth
    >
      <Box component="form" onSubmit={handleUnlock} noValidate>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <LockOutlined color="primary" />
          Unlock Vault
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter your master password to decrypt your vault items. It never
            leaves your device.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="Master Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (localError) setLocalError(null);
            }}
            error={!!localError}
            helperText={localError ?? " "}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <VisibilityOff fontSize="small" />
                      ) : (
                        <Visibility fontSize="small" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} disabled={isLoading} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!password || isLoading}
          >
            {isLoading ? (
              <CircularProgress size={22} color="inherit" />
            ) : (
              "Unlock"
            )}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

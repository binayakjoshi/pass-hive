"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

import Input from "@/components/custom-elements/input";
import { useForm } from "@/hooks/use-form";
import { VALIDATOR_REQUIRE, VALIDATOR_EMAIL } from "@/lib/validators";
import { useVaultSession } from "@/context/vault-session";
import { deriveMasterKey, unwrapVaultKey } from "@/lib/crypto";
import { useUser } from "@/context/user-context";
import { useToast } from "@/context/snackbar-context";

export default function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const showToast = useToast();

  // Held only in memory, only for the duration of a pending reactivation
  // confirm — cleared immediately after the confirm attempt, success or not.
  // Same no-persistence rule as the vault key.
  const [pendingReactivation, setPendingReactivation] = useState<{
    email: string;
    masterPassword: string;
  } | null>(null);

  const [formState, inputHandler] = useForm(
    {
      email: { value: "", isValid: false, touched: false },
      masterPassword: { value: "", isValid: false, touched: false },
    },
    false,
  );
  const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;
  const { setVaultKey } = useVaultSession();
  const { fetchUser, setPendingVerification } = useUser();

  // Shared by both the first attempt and the confirmed-reactivation retry.
  const attemptLogin = async (
    email: string,
    masterPassword: string,
    confirmReactivation: boolean,
  ) => {
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        master_password: masterPassword,
        confirm_reactivation: confirmReactivation,
      }),
    });

    if (!loginRes.ok) {
      const body = await loginRes.json();

      if (body.code === "USER_NOT_VERIFIED") {
        setPendingVerification({
          email,
          expiresAt: Date.now() + body.data.otp_expires_in * 1000,
        });
        showToast(body.message, "info");
        router.push("/verify-otp");
        return { handled: true };
      }

      if (body.code === "ACCOUNT_PENDING_REACTIVATION") {
        // Only reachable on the *first* attempt (confirmReactivation=false).
        // Surface the confirm dialog instead of treating this as an error.
        setPendingReactivation({ email, masterPassword });
        return { handled: true };
      }

      throw new Error(body.message ?? "Login failed");
    }

    // Success path — identical whether this was a normal login or a
    // confirmed reactivation, since the backend already flipped
    // delete_status before returning the token.
    fetchUser();
    const vaultRes = await fetch(`${API_URL}/vaults/current`, {
      credentials: "include",
    });
    if (!vaultRes.ok) {
      throw new Error("Could not load vault");
    }

    const { encrypted_vault_key, vault_key_iv } = await vaultRes.json();
    const masterKey = await deriveMasterKey(masterPassword, email);
    const vaultKey = await unwrapVaultKey(
      encrypted_vault_key,
      vault_key_iv,
      masterKey,
    );

    setVaultKey(vaultKey);
    router.push("/vault");
    return { handled: true };
  };

  const submitHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.isValid) return;

    setIsLoading(true);
    try {
      const email = formState.inputs.email.value as string;
      const masterPassword = formState.inputs.masterPassword.value as string;
      await attemptLogin(email, masterPassword, false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Login failed", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const confirmReactivationHandler = async () => {
    if (!pendingReactivation) return;
    const { email, masterPassword } = pendingReactivation;

    setIsLoading(true);
    try {
      await attemptLogin(email, masterPassword, true);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Login failed", "error");
    } finally {
      setIsLoading(false);
      // Cleared regardless of outcome — never held longer than one retry.
      setPendingReactivation(null);
    }
  };

  return (
    <>
      <form onSubmit={submitHandler} noValidate>
        <Input
          id="email"
          element="input"
          type="email"
          label="Email"
          autocomplete="email"
          validators={[VALIDATOR_REQUIRE(), VALIDATOR_EMAIL()]}
          errorText="Please enter a valid email address."
          onInput={inputHandler}
          sx={{ mb: 2.5 }}
        />
        <Input
          id="masterPassword"
          element="input"
          type={showPassword ? "text" : "password"}
          label="Master Password"
          autocomplete="current-password"
          validators={[VALIDATOR_REQUIRE()]}
          errorText="Master password is required."
          onInput={inputHandler}
          endAdornment={
            <IconButton
              edge="end"
              size="small"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <VisibilityOff fontSize="small" />
              ) : (
                <Visibility fontSize="small" />
              )}
            </IconButton>
          }
        />

        <Button
          type="submit"
          variant="contained"
          fullWidth
          size="large"
          disabled={!formState.isValid || isLoading}
          sx={{ mt: 3 }}
        >
          {isLoading ? (
            <CircularProgress size={22} color="inherit" />
          ) : (
            "Unlock Vault"
          )}
        </Button>
      </form>

      <Dialog
        open={pendingReactivation !== null}
        onClose={() => setPendingReactivation(null)}
      >
        <DialogTitle>Reactivate your account?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This account was previously deleted. Logging in again will restore
            it, including any vault items that weren&apos;t yet permanently
            purged.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setPendingReactivation(null)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmReactivationHandler}
            variant="contained"
            disabled={isLoading}
          >
            {isLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Reactivate"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

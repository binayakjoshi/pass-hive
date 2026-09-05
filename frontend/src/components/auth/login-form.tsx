"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, IconButton, CircularProgress } from "@mui/material";
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

  const submitHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.isValid) return;

    setIsLoading(true);

    try {
      const email = formState.inputs.email.value as string;
      const masterPassword = formState.inputs.masterPassword.value as string;

      // 1. Authenticate — sets the httpOnly access_token cookie.
      const loginRes = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, master_password: masterPassword }),
      });
      if (!loginRes.ok) {
        const body = await loginRes.json();
        if (body.code == "USER_NOT_VERIFIED") {
          setPendingVerification({
            email: formState.inputs.email.value as string,
            expiresAt: Date.now() + body.data.otp_expires_in * 1000,
          });
          showToast(body.message, "info");
          router.push("/verify-otp");
          return;
        }
        throw new Error(body.message ?? "Login failed");
      }

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
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Login failed", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
  );
}

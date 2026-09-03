"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, IconButton, Alert, CircularProgress } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { deriveMasterKey, generateVaultKey, wrapVaultKey } from "@/lib/crypto";

import Input from "@/components/custom-elements/input";
import { useForm } from "@/hooks/use-form";
import {
  VALIDATOR_REQUIRE,
  VALIDATOR_EMAIL,
  VALIDATOR_MINLENGTH,
} from "@/lib/validators";

export default function SignupForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formState, inputHandler] = useForm(
    {
      email: { value: "", isValid: false, touched: false },
      masterPassword: { value: "", isValid: false, touched: false },
      confirmMasterPassword: { value: "", isValid: false, touched: false },
    },
    false,
  );
  const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;
  const password = formState.inputs.masterPassword.value as string;
  const confirmPassword = formState.inputs.confirmMasterPassword
    .value as string;
  const passwordsMismatch =
    formState.inputs.confirmMasterPassword.touched &&
    confirmPassword.length > 0 &&
    password !== confirmPassword;

  const canSubmit = formState.isValid && password === confirmPassword;

  const submitHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setServerError(null);
    setIsLoading(true);

    try {
      const email = formState.inputs.email.value as string;
      const masterPassword = formState.inputs.masterPassword.value as string;

      const masterKey = await deriveMasterKey(masterPassword, email);

      const vaultKey = await generateVaultKey();

      const { encrypted_vault_key, vault_key_iv } = await wrapVaultKey(
        vaultKey,
        masterKey,
      );

      const res = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          master_password: masterPassword,
          encrypted_vault_key,
          vault_key_iv,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.message ?? "Signup failed");
      }

      router.push("/login");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Signup failed");
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
        autocomplete="new-password"
        validators={[VALIDATOR_REQUIRE(), VALIDATOR_MINLENGTH(12)]}
        errorText="Use at least 12 characters — this unlocks everything else."
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
        sx={{ mb: 2.5 }}
      />
      <Input
        id="confirmMasterPassword"
        element="input"
        type={showPassword ? "text" : "password"}
        label="Confirm Master Password"
        autocomplete="new-password"
        validators={[VALIDATOR_REQUIRE()]}
        errorText="Please confirm your master password."
        onInput={inputHandler}
      />
      {passwordsMismatch && (
        <Alert severity="warning" sx={{ mt: 1.5 }}>
          Passwords don't match.
        </Alert>
      )}

      <Alert severity="info" variant="outlined" sx={{ mt: 2.5 }}>
        Your master password can't be recovered if lost — it's never stored or
        sent anywhere.
      </Alert>

      {serverError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {serverError}
        </Alert>
      )}

      <Button
        type="submit"
        variant="contained"
        fullWidth
        size="large"
        disabled={!canSubmit || isLoading}
        sx={{ mt: 3 }}
      >
        {isLoading ? (
          <CircularProgress size={22} color="inherit" />
        ) : (
          "Create Vault"
        )}
      </Button>
    </form>
  );
}

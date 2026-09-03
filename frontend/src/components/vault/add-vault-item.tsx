"use client";

import type React from "react";
import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  IconButton,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Close } from "@mui/icons-material";

import Input from "@/components/custom-elements/input";
import { useForm, InputState } from "@/hooks/use-form";
import { VALIDATOR_REQUIRE } from "@/lib/validators";
import { encryptField } from "@/lib/crypto";
import { useVaultSession } from "@/context/vault-session";
import { VaultItemType } from "@/types/vault";

const TYPE_OPTIONS = [
  { value: "login", label: "Login" },
  { value: "card", label: "Card" },
  { value: "note", label: "Note" },
  { value: "identity", label: "Identity" },
  { value: "ssh_key", label: "SSH Key" },
];

// Fields per type. `key` becomes a field inside the JSON `data` blob —
// `title` is handled separately since it's always its own encrypted column.
type FieldConfig = {
  key: string;
  label: string;
  type?: string;
  required?: boolean;
  multiline?: boolean;
};

const TYPE_FIELDS: Record<VaultItemType, FieldConfig[]> = {
  login: [
    { key: "username", label: "Username", required: true },
    { key: "password", label: "Password", type: "password", required: true },
    { key: "url", label: "Website URL" },
    { key: "notes", label: "Notes", multiline: true },
  ],
  card: [
    { key: "cardholderName", label: "Cardholder Name", required: true },
    { key: "number", label: "Card Number", required: true },
    { key: "expiry", label: "Expiry (MM/YY)", required: true },
    { key: "cvv", label: "CVV", type: "password", required: true },
    { key: "notes", label: "Notes", multiline: true },
  ],
  note: [{ key: "content", label: "Note", multiline: true, required: true }],
  identity: [
    { key: "fullName", label: "Full Name", required: true },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "address", label: "Address", multiline: true },
  ],
  ssh_key: [
    { key: "host", label: "Host" },
    {
      key: "privateKey",
      label: "Private Key",
      multiline: true,
      required: true,
    },
    { key: "publicKey", label: "Public Key", multiline: true },
    { key: "notes", label: "Notes", multiline: true },
  ],
};

function buildInitialInputs(type: VaultItemType): Record<string, InputState> {
  const inputs: Record<string, InputState> = {
    title: { value: "", isValid: false, touched: false },
  };
  for (const field of TYPE_FIELDS[type]) {
    inputs[field.key] = {
      value: "",
      isValid: !field.required, // optional fields start valid
      touched: false,
    };
  }
  return inputs;
}

interface AddItemModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void; // parent reloads the list after a successful save
}

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

export default function AddItemModal({
  open,
  onClose,
  onCreated,
}: AddItemModalProps) {
  const { vaultKey } = useVaultSession();
  const [type, setType] = useState<VaultItemType>("login");
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formState, inputHandler, setFormData] = useForm(
    buildInitialInputs("login"),
    false,
  );

  const handleTypeChange = (_id: string, value: string | boolean) => {
    const newType = value as VaultItemType;
    setType(newType);
    setFormData(buildInitialInputs(newType), false); // fresh, empty fields for the new type
  };

  const handleClose = () => {
    setServerError(null);
    setType("login");
    setFormData(buildInitialInputs("login"), false);
    onClose();
  };

  const submitHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.isValid || !vaultKey) return;

    setServerError(null);
    setIsSubmitting(true);

    try {
      const title = formState.inputs.title.value as string;

      const data: Record<string, string> = {};
      for (const field of TYPE_FIELDS[type]) {
        data[field.key] = (formState.inputs[field.key]?.value as string) ?? "";
      }

      const { ciphertext: encrypted_title, iv: title_iv } = await encryptField(
        title,
        vaultKey,
      );
      const { ciphertext: encrypted_data, iv: data_iv } = await encryptField(
        JSON.stringify(data),
        vaultKey,
      );

      const res = await fetch(`${API_URL}/vaults/items`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          encrypted_title,
          title_iv,
          encrypted_data,
          data_iv,
          favorite: false,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.message ?? "Failed to create item");
      }

      onCreated();
      handleClose();
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Failed to create item",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <form onSubmit={submitHandler} noValidate>
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          Add Item
          <IconButton onClick={handleClose} size="small">
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Input
              id="itemType"
              element="select"
              label="Type"
              options={TYPE_OPTIONS}
              initialValue={type}
              onInput={handleTypeChange}
              validators={[VALIDATOR_REQUIRE()]}
            />

            <Input
              id="title"
              element="input"
              type="text"
              label="Title"
              validators={[VALIDATOR_REQUIRE()]}
              errorText="A title is required."
              onInput={inputHandler}
            />

            {TYPE_FIELDS[type].map((field) => (
              <Input
                key={`${type}-${field.key}`} // remount on type change → clears stale values
                id={field.key}
                element={field.multiline ? "textarea" : "input"}
                type={field.type ?? "text"}
                label={field.label}
                rows={field.multiline ? 3 : undefined}
                validators={field.required ? [VALIDATOR_REQUIRE()] : []}
                errorText={`${field.label} is required.`}
                onInput={inputHandler}
              />
            ))}

            {serverError && <Alert severity="error">{serverError}</Alert>}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!formState.isValid || isSubmitting}
          >
            {isSubmitting ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Save"
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

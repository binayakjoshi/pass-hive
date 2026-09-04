"use client";

import type React from "react";
import { useEffect, useState } from "react";
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
  FormControlLabel,
  Switch,
  Box,
} from "@mui/material";
import { Close, Star, StarBorder } from "@mui/icons-material";

import Input from "@/components/custom-elements/input";
import PasswordFieldWithGenerator from "./password-field-generator";
import { useForm, InputState } from "@/hooks/use-form";
import { VALIDATOR_REQUIRE } from "@/lib/validators";
import { encryptField } from "@/lib/crypto";
import { useVaultSession } from "@/context/vault-session";
import { VaultItemDecrypted, VaultItemType } from "@/types/vault";
import { useToast } from "@/context/snackbar-context";

const TYPE_OPTIONS = [
  { value: "login", label: "Login" },
  { value: "card", label: "Card" },
  { value: "note", label: "Note" },
  { value: "identity", label: "Identity" },
  { value: "ssh_key", label: "SSH Key" },
];

type FieldConfig = {
  key: string;
  label: string;
  type?: string;
  required?: boolean;
  multiline?: boolean;
  generate?: boolean; // show the dice/generate button (password fields only)
};

const TYPE_FIELDS: Record<VaultItemType, FieldConfig[]> = {
  login: [
    { key: "username", label: "Username", required: true },
    {
      key: "password",
      label: "Password",
      type: "password",
      required: true,
      generate: true,
    },
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
      type: "password",
      multiline: true,
      required: true,
    },
    { key: "publicKey", label: "Public Key", multiline: true },
    { key: "notes", label: "Notes", multiline: true },
  ],
};

function buildInitialInputs(
  type: VaultItemType,
  prefill?: { title: string; data: Record<string, unknown> },
): Record<string, InputState> {
  const inputs: Record<string, InputState> = {
    title: {
      value: prefill?.title ?? "",
      isValid: !!prefill?.title,
      touched: !!prefill,
    },
  };
  for (const field of TYPE_FIELDS[type]) {
    const prefillValue = (prefill?.data?.[field.key] as string) ?? "";
    inputs[field.key] = {
      value: prefillValue,
      isValid: field.required ? !!prefillValue : true,
      touched: !!prefill,
    };
  }
  return inputs;
}

interface AddItemModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void; // parent reloads the list after a successful save (add or edit)
  item?: VaultItemDecrypted | null; // present => edit mode
}

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

export default function AddItemModal({
  open,
  onClose,
  onCreated,
  item = null,
}: AddItemModalProps) {
  const { vaultKey } = useVaultSession();
  const isEdit = !!item;

  const [type, setType] = useState<VaultItemType>(item?.type ?? "login");
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formState, inputHandler, setFormData] = useForm(
    buildInitialInputs(item?.type ?? "login", item ?? undefined),
    isEdit, // valid immediately when opened with existing, complete data
  );
  const [favorite, setFavorite] = useState<boolean>(item?.favorite ?? false);
  const showToast = useToast();
  // Re-seed the form whenever the modal is (re)opened for a (possibly
  // different) item — covers both "open the add modal fresh" and
  // "open the edit modal for item X after previously editing item Y".
  useEffect(() => {
    if (!open) return;
    const nextType = item?.type ?? "login";
    setType(nextType);
    setServerError(null);
    setFavorite(item?.favorite ?? false);
    setFormData(buildInitialInputs(nextType, item ?? undefined), isEdit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item]);

  const handleTypeChange = (_id: string, value: string | boolean) => {
    if (isEdit) return; // type is locked once an item exists
    const newType = value as VaultItemType;
    setType(newType);
    setFormData(buildInitialInputs(newType), false);
  };

  const handleClose = () => {
    setServerError(null);
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

      const url = isEdit
        ? `${API_URL}/vaults/items/${item!.id}`
        : `${API_URL}/vaults/items`;
      const method = isEdit ? "PATCH" : "POST";

      const body = isEdit
        ? { encrypted_title, title_iv, encrypted_data, data_iv, favorite }
        : {
            type,
            encrypted_title,
            title_iv,
            encrypted_data,
            data_iv,
            favorite: false,
          };

      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const resBody = await res.json();
        throw new Error(
          resBody.message ?? `Failed to ${isEdit ? "update" : "create"} item`,
        );
      }

      onCreated();
      handleClose();
      showToast("Vault Item updated successfully", "success");
    } catch (err) {
      setServerError(
        err instanceof Error
          ? err.message
          : `Failed to ${isEdit ? "update" : "create"} item`,
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
          {isEdit ? "Edit Item" : "Add Item"}
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
            <Box sx={{ position: "relative" }}>
              <Input
                id="title"
                element="input"
                type="text"
                label="Title"
                initialValue={formState.inputs.title.value as string}
                initialValid={formState.inputs.title.isValid}
                validators={[VALIDATOR_REQUIRE()]}
                errorText="A title is required."
                onInput={inputHandler}
              />
              {isEdit && (
                <IconButton
                  size="small"
                  onClick={() => setFavorite((f) => !f)}
                  sx={{
                    position: "absolute",
                    right: 16,
                    top: 16, // fixed offset from the label row, not a % of total box height
                  }}
                >
                  {favorite ? (
                    <Star fontSize="small" color="warning" />
                  ) : (
                    <StarBorder
                      fontSize="small"
                      sx={{ color: "text.disabled" }}
                    />
                  )}
                </IconButton>
              )}
            </Box>{" "}
            {TYPE_FIELDS[type].map((field) =>
              field.type === "password" ? (
                <PasswordFieldWithGenerator
                  key={`${item?.id ?? "new"}-${type}-${field.key}`}
                  id={field.key}
                  label={field.label}
                  value={(formState.inputs[field.key]?.value as string) ?? ""}
                  required={field.required}
                  touched={formState.inputs[field.key]?.touched}
                  isValid={formState.inputs[field.key]?.isValid}
                  errorText={`${field.label} is required.`}
                  allowGenerate={!!field.generate}
                  onChange={inputHandler}
                />
              ) : (
                <Input
                  key={`${item?.id ?? "new"}-${type}-${field.key}`}
                  id={field.key}
                  element={field.multiline ? "textarea" : "input"}
                  type={field.type ?? "text"}
                  label={field.label}
                  initialValue={
                    (formState.inputs[field.key]?.value as string) ?? ""
                  }
                  initialValid={formState.inputs[field.key]?.isValid} // add this
                  rows={field.multiline ? 3 : undefined}
                  validators={field.required ? [VALIDATOR_REQUIRE()] : []}
                  errorText={`${field.label} is required.`}
                  onInput={inputHandler}
                />
              ),
            )}
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
            ) : isEdit ? (
              "Save Changes"
            ) : (
              "Save"
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

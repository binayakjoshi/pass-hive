"use client";

import { useEffect, useState } from "react";
import {
  TextField,
  IconButton,
  InputAdornment,
  Tooltip,
  Popover,
  Box,
  Stack,
  Typography,
  Slider,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Button,
  Chip,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Casino,
  ContentCopy,
  Refresh,
} from "@mui/icons-material";
import {
  generatePassword,
  passwordPoolSize,
  estimateEntropyBits,
  getStrength,
  type PasswordOptions,
} from "@/lib/generator";

interface Props {
  id: string;
  label: string;
  value: string;
  required?: boolean;
  errorText?: string;
  touched?: boolean;
  isValid?: boolean;
  allowGenerate?: boolean;
  onChange: (id: string, value: string, isValid: boolean) => void;
}

const DEFAULT_OPTIONS: PasswordOptions = {
  length: 16,
  useLower: true,
  useUpper: true,
  useNumbers: true,
  useSpecial: true,
  minNumbers: 1,
  minSpecial: 1,
};

export default function PasswordFieldWithGenerator({
  id,
  label,
  value,
  required,
  errorText,
  touched,
  isValid = true,
  allowGenerate = true,
  onChange,
}: Props) {
  const [visible, setVisible] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [options, setOptions] = useState<PasswordOptions>(DEFAULT_OPTIONS);
  const [preview, setPreview] = useState("");

  const noCharsetSelected =
    !options.useLower &&
    !options.useUpper &&
    !options.useNumbers &&
    !options.useSpecial;

  // Regenerate the preview any time the popover is open and options change —
  // mirrors PasswordGenerator's own behavior, so the user sees what they'll
  // get before committing to it.
  useEffect(() => {
    if (!anchorEl) return;
    if (noCharsetSelected) {
      setPreview("");
      return;
    }
    setPreview(generatePassword(options));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchorEl, options]);

  const openGenerator = (e: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(e.currentTarget);
  const closeGenerator = () => setAnchorEl(null);

  const update = <K extends keyof PasswordOptions>(
    key: K,
    val: PasswordOptions[K],
  ) => setOptions((prev) => ({ ...prev, [key]: val }));

  const regeneratePreview = () => {
    if (noCharsetSelected) return;
    setPreview(generatePassword(options));
  };

  const poolSize = passwordPoolSize(options);
  const entropy = estimateEntropyBits(options.length, poolSize);
  const strength = getStrength(entropy);

  const handleUse = () => {
    if (!preview) return;
    onChange(id, preview, true);
    closeGenerator();
  };

  const showError = touched && !isValid;

  return (
    <>
      <TextField
        id={id}
        label={label}
        type={visible ? "text" : "password"}
        value={value}
        required={required}
        error={showError}
        helperText={showError ? errorText : undefined}
        onChange={(e) =>
          onChange(id, e.target.value, required ? !!e.target.value : true)
        }
        onBlur={() => onChange(id, value, required ? !!value : true)}
        fullWidth
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end" sx={{ gap: 0.5 }}>
                {allowGenerate && (
                  <Tooltip title="Generate">
                    <IconButton onClick={openGenerator} edge="end" size="small">
                      <Casino fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title={visible ? "Hide" : "Show"}>
                  <IconButton
                    onClick={() => setVisible((v) => !v)}
                    edge="end"
                    size="small"
                  >
                    {visible ? (
                      <VisibilityOff fontSize="small" />
                    ) : (
                      <Visibility fontSize="small" />
                    )}
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ),
          },
        }}
      />

      <Popover
        open={!!anchorEl}
        anchorEl={anchorEl}
        onClose={closeGenerator}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Box sx={{ p: 3, width: 380, maxWidth: "90vw" }}>
          <Stack spacing={2.5}>
            <TextField
              value={preview}
              placeholder="Select at least one option"
              fullWidth
              size="small"
              slotProps={{
                input: {
                  readOnly: true,
                  sx: { fontFamily: "monospace", fontSize: "0.95rem" },
                  endAdornment: (
                    <InputAdornment position="end" sx={{ gap: 0.25 }}>
                      <Tooltip title="Regenerate">
                        <span>
                          <IconButton
                            onClick={regeneratePreview}
                            edge="end"
                            size="small"
                            disabled={noCharsetSelected}
                          >
                            <Refresh fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Copy">
                        <span>
                          <IconButton
                            onClick={() =>
                              preview && navigator.clipboard.writeText(preview)
                            }
                            edge="end"
                            size="small"
                            disabled={!preview}
                          >
                            <ContentCopy fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Box>
              <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Length
                </Typography>
                <Chip
                  label={options.length}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Stack>
              <Slider
                value={options.length}
                onChange={(_, v) => update("length", v as number)}
                min={8}
                max={64}
                step={1}
                size="small"
              />
            </Box>

            <FormGroup>
              <Stack direction="row" sx={{ columnGap: 6, flexWrap: "wrap" }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={options.useLower}
                      onChange={(e) => update("useLower", e.target.checked)}
                    />
                  }
                  label="a-z"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={options.useUpper}
                      onChange={(e) => update("useUpper", e.target.checked)}
                    />
                  }
                  label="A-Z"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={options.useNumbers}
                      onChange={(e) => update("useNumbers", e.target.checked)}
                    />
                  }
                  label="0-9"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={options.useSpecial}
                      onChange={(e) => update("useSpecial", e.target.checked)}
                    />
                  }
                  label="!@#"
                />
              </Stack>
            </FormGroup>

            {noCharsetSelected ? (
              <Typography variant="caption" color="error">
                Select at least one character type.
              </Typography>
            ) : (
              <Typography variant="caption" color="text.secondary">
                Strength: {strength.label} (~{entropy} bits)
              </Typography>
            )}

            <Button variant="contained" onClick={handleUse} disabled={!preview}>
              Use this password
            </Button>
          </Stack>
        </Box>
      </Popover>
    </>
  );
}

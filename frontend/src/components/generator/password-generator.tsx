"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Slider,
  FormGroup,
  FormControlLabel,
  Checkbox,
  TextField,
  LinearProgress,
  Chip,
} from "@mui/material";
import GeneratorResultField from "./generator-result-field";
import {
  generatePassword,
  passwordPoolSize,
  estimateEntropyBits,
  getStrength,
  type PasswordOptions,
} from "@/lib/generator";

export default function PasswordGenerator() {
  const [options, setOptions] = useState<PasswordOptions>({
    length: 16,
    useLower: true,
    useUpper: true,
    useNumbers: true,
    useSpecial: true,
    minNumbers: 1,
    minSpecial: 1,
  });
  const [password, setPassword] = useState("");

  const regenerate = () => setPassword(generatePassword(options));

  useEffect(() => {
    regenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options]);

  const noCharsetSelected =
    !options.useLower &&
    !options.useUpper &&
    !options.useNumbers &&
    !options.useSpecial;

  const poolSize = passwordPoolSize(options);
  const entropy = estimateEntropyBits(password.length, poolSize);
  const strength = getStrength(entropy);

  const update = <K extends keyof PasswordOptions>(
    key: K,
    value: PasswordOptions[K],
  ) => setOptions((prev) => ({ ...prev, [key]: value }));

  return (
    <Stack spacing={3}>
      <GeneratorResultField
        value={password}
        onRegenerate={regenerate}
        ariaLabel="Generated password"
      />

      {!noCharsetSelected && password && (
        <Box>
          <Stack
            direction="row"
            sx={{
              mb: 0.5,

              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Strength: {strength.label} (~{entropy} bits)
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={strength.percent}
            color={strength.color}
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>
      )}

      {noCharsetSelected && (
        <Typography variant="body2" color="error">
          Select at least one character type below.
        </Typography>
      )}

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
          sx={{ mt: 2 }}
        />
      </Box>
      <FormGroup>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          sx={{ flexWrap: "wrap" }}
        >
          <FormControlLabel
            control={
              <Checkbox
                checked={options.useLower}
                onChange={(e) => update("useLower", e.target.checked)}
              />
            }
            label="Lowercase (a-z)"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={options.useUpper}
                onChange={(e) => update("useUpper", e.target.checked)}
              />
            }
            label="Uppercase (A-Z)"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={options.useNumbers}
                onChange={(e) => update("useNumbers", e.target.checked)}
              />
            }
            label="Numbers (0-9)"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={options.useSpecial}
                onChange={(e) => update("useSpecial", e.target.checked)}
              />
            }
            label="Special (!@#$)"
          />
        </Stack>
      </FormGroup>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          label="Min numbers"
          type="number"
          size="small"
          fullWidth
          disabled={!options.useNumbers}
          value={options.minNumbers}
          onChange={(e) =>
            update("minNumbers", Math.max(0, Number(e.target.value)))
          }
          slotProps={{ htmlInput: { min: 0, max: options.length } }}
        />
        <TextField
          label="Min special"
          type="number"
          size="small"
          fullWidth
          disabled={!options.useSpecial}
          value={options.minSpecial}
          onChange={(e) =>
            update("minSpecial", Math.max(0, Number(e.target.value)))
          }
          slotProps={{ htmlInput: { min: 0, max: options.length } }}
        />
      </Stack>

      {options.minNumbers + options.minSpecial > options.length && (
        <Typography variant="caption" color="text.secondary">
          Minimums exceed length — password will be extended to fit them.
        </Typography>
      )}
    </Stack>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Slider,
  FormControlLabel,
  Checkbox,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import GeneratorResultField from "./generator-result-field";
import {
  generatePassphrase,
  passphraseEntropyBits,
  type PassphraseOptions,
} from "@/lib/generator";

const SEPARATORS = [
  { label: "-", value: "-" },
  { label: "_", value: "_" },
  { label: ".", value: "." },
  { label: "space", value: " " },
];

export default function PassphraseGenerator() {
  const [options, setOptions] = useState<PassphraseOptions>({
    wordCount: 4,
    separator: "-",
    capitalize: true,
    includeNumber: true,
  });
  const [passphrase, setPassphrase] = useState("");

  const regenerate = () => setPassphrase(generatePassphrase(options));

  useEffect(() => {
    regenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options]);

  const update = <K extends keyof PassphraseOptions>(
    key: K,
    value: PassphraseOptions[K],
  ) => setOptions((prev) => ({ ...prev, [key]: value }));

  const entropy = passphraseEntropyBits(options.wordCount);

  return (
    <Stack spacing={3}>
      <GeneratorResultField
        value={passphrase}
        onRegenerate={regenerate}
        ariaLabel="Generated passphrase"
      />

      <Typography variant="caption" color="text.secondary">
        ~{entropy} bits of entropy from word choice alone
      </Typography>

      <Box>
        <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
          Number of words: {options.wordCount}
        </Typography>
        <Slider
          value={options.wordCount}
          onChange={(_, v) => update("wordCount", v as number)}
          min={3}
          max={8}
          step={1}
          marks
        />
      </Box>

      <Box>
        <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
          Separator
        </Typography>
        <ToggleButtonGroup
          value={options.separator}
          exclusive
          onChange={(_, v) => v && update("separator", v)}
          size="small"
          color="primary"
          sx={{
            gap: 1,
            "& .MuiToggleButton-root": {
              border: "1px solid",
              borderColor: "divider",
              borderRadius: "8px !important", // override the group's shared-edge radius logic
              px: 2,
            },
          }}
        >
          {SEPARATORS.map((s) => (
            <ToggleButton key={s.value} value={s.value}>
              {s.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <Stack direction={{ xs: "column", sm: "row" }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={options.capitalize}
              onChange={(e) => update("capitalize", e.target.checked)}
            />
          }
          label="Capitalize each word"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={options.includeNumber}
              onChange={(e) => update("includeNumber", e.target.checked)}
            />
          }
          label="Include a number"
        />
      </Stack>
    </Stack>
  );
}

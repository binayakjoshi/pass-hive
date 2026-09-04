"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  FormControlLabel,
  Checkbox,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import GeneratorResultField from "./generator-result-field";
import {
  generateUsername,
  type UsernameOptions,
  type UsernameStyle,
} from "@/lib/generator";

const STYLES: { label: string; value: UsernameStyle }[] = [
  { label: "Adjective + Noun", value: "adjective-noun" },
  { label: "Noun + Noun", value: "noun-noun" },
  { label: "Single Word", value: "single-word" },
];

const SEPARATORS = [
  { label: "none", value: "" },
  { label: "-", value: "-" },
  { label: "_", value: "_" },
  { label: ".", value: "." },
];

export default function UsernameGenerator() {
  const [options, setOptions] = useState<UsernameOptions>({
    style: "adjective-noun",
    separator: "",
    includeNumber: true,
    titleCase: false,
  });
  const [username, setUsername] = useState("");

  const regenerate = () => setUsername(generateUsername(options));

  useEffect(() => {
    regenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options]);

  const update = <K extends keyof UsernameOptions>(
    key: K,
    value: UsernameOptions[K],
  ) => setOptions((prev) => ({ ...prev, [key]: value }));

  return (
    <Stack spacing={3}>
      <GeneratorResultField
        value={username}
        onRegenerate={regenerate}
        ariaLabel="Generated username"
      />

      <Box>
        <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
          Style
        </Typography>
        <ToggleButtonGroup
          value={options.style}
          exclusive
          onChange={(_, v) => v && update("style", v)}
          size="small"
          color="primary"
          sx={{
            gap: 1,
            flexWrap: "wrap",
            "& .MuiToggleButton-root": {
              border: "1px solid",
              borderColor: "divider",
              borderRadius: "8px !important",
              px: 2,
            },
          }}
        >
          {STYLES.map((s) => (
            <ToggleButton key={s.value} value={s.value}>
              {s.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <Box>
        <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
          Separator
        </Typography>
        <ToggleButtonGroup
          value={options.separator}
          exclusive
          onChange={(_, v) => v !== null && update("separator", v)}
          size="small"
          color="primary"
          disabled={options.style === "single-word"}
          sx={{
            gap: 1,
            "& .MuiToggleButton-root": {
              border: "1px solid",
              borderColor: "divider",
              borderRadius: "8px !important",
              px: 2,
            },
          }}
        >
          {SEPARATORS.map((s) => (
            <ToggleButton key={s.value || "none"} value={s.value}>
              {s.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <Stack direction={{ xs: "column", sm: "row" }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={options.includeNumber}
              onChange={(e) => update("includeNumber", e.target.checked)}
            />
          }
          label="Append a number"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={options.titleCase}
              onChange={(e) => update("titleCase", e.target.checked)}
            />
          }
          label="Title Case"
        />
      </Stack>
    </Stack>
  );
}

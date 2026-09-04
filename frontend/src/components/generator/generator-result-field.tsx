"use client";

import { TextField, IconButton, InputAdornment, Tooltip } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useToast } from "@/context/snackbar-context";

interface Props {
  value: string;
  onRegenerate: () => void;
  ariaLabel: string;
}

export default function GeneratorResultField({
  value,
  onRegenerate,
  ariaLabel,
}: Props) {
  const showToast = useToast();

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      showToast("Copied to clipboard", "success");
    } catch {
      showToast("Couldn't copy — try selecting the text manually", "error");
    }
  };

  return (
    <TextField
      value={value}
      placeholder="Select at least one option to generate"
      fullWidth
      slotProps={{
        input: {
          readOnly: true,
          "aria-label": ariaLabel,
          sx: { fontFamily: "monospace", fontSize: "1.05rem" },
          endAdornment: (
            <InputAdornment position="end" sx={{ gap: 0.5 }}>
              <Tooltip title="Generate new">
                <span>
                  <IconButton onClick={onRegenerate} edge="end" size="small">
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Copy to clipboard">
                <span>
                  <IconButton
                    onClick={handleCopy}
                    edge="end"
                    size="small"
                    disabled={!value}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}

import { Box, Paper, Typography, Stack } from "@mui/material";
import type { ReactNode } from "react";

export default function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        bgcolor: "background.default",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 420,
          p: { xs: 3, sm: 4 },
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Stack spacing={0.5} sx={{ mb: 3, textAlign: "center" }}>
          <Typography variant="h5" color="primary.dark">
            🐝 Pass-Hive
          </Typography>
          <Typography variant="h6">{title}</Typography>
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        </Stack>

        <Stack spacing={2.5}>{children}</Stack>

        <Box sx={{ mt: 3, textAlign: "center" }}>{footer}</Box>
      </Paper>
    </Box>
  );
}

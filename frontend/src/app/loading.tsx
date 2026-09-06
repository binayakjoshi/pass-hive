import { Box, CircularProgress, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { getTheme } from "@/app/theme"; // adjust to your actual theme file path

const theme = getTheme("light");

const blobBackground = `radial-gradient(circle, ${alpha(
  theme.palette.primary.main,
  0.12,
)} 0%, transparent 70%)`;

const ring1Border = `1.5px solid ${alpha(theme.palette.primary.light, 0.3)}`;
const ring2Border = `1.5px solid ${alpha(theme.palette.primary.light, 0.2)}`;

export default function Loading() {
  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: blobBackground,
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 4,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            width: 80,
            height: 80,
            borderRadius: "50%",
            border: ring1Border,
            animation: "pulseRing 2s ease-in-out infinite",
            "@keyframes pulseRing": {
              "0%": { transform: "scale(1)", opacity: 0.6 },
              "50%": { transform: "scale(1.4)", opacity: 0 },
              "100%": { transform: "scale(1)", opacity: 0 },
            },
          }}
        />
        <Box
          sx={{
            position: "absolute",
            width: 80,
            height: 80,
            borderRadius: "50%",
            border: ring2Border,
            animation: "pulseRing2 2s ease-in-out 0.6s infinite",
            "@keyframes pulseRing2": {
              "0%": { transform: "scale(1)", opacity: 0.4 },
              "50%": { transform: "scale(1.6)", opacity: 0 },
              "100%": { transform: "scale(1)", opacity: 0 },
            },
          }}
        />
        <CircularProgress
          size={48}
          thickness={3}
          sx={{
            color: "primary.main",
            "& .MuiCircularProgress-circle": {
              strokeLinecap: "round",
            },
          }}
        />
      </Box>
      <Typography
        variant="body2"
        sx={{
          mt: 1,
          color: "text.secondary",
          letterSpacing: "0.08em",
          fontSize: "0.75rem",
          textTransform: "uppercase",
          "@keyframes fadeInUp": {
            "0%": { opacity: 0, transform: "translateY(8px)" },
            "100%": { opacity: 1, transform: "translateY(0)" },
          },
          animation: "fadeInUp 0.8s ease-out 0.15s both",
        }}
      >
        Loading…
      </Typography>
    </Box>
  );
}

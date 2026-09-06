import Link from "next/link";
import { Box, Button, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { getTheme } from "@/app/theme"; // adjust to your actual theme file path

const theme = getTheme("light"); // pick the mode you want these pages to render in

const blobBackground = `radial-gradient(circle, ${alpha(
  theme.palette.primary.main,
  0.08,
)} 0%, transparent 70%)`;

const headingGradient = `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.light} 50%, ${theme.palette.primary.dark} 100%)`;

export default function NotFound() {
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
        color: "text.primary",
        overflow: "hidden",
        px: 3,
      }}
    >
      <Box
        sx={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: blobBackground,
          filter: "blur(80px)",
          pointerEvents: "none",
          top: "20%",
        }}
      />
      <Typography
        component="h1"
        sx={{
          fontSize: "clamp(7rem, 15vw, 11rem)",
          fontWeight: 800,
          lineHeight: 1,
          background: headingGradient,
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          letterSpacing: "-0.04em",
          userSelect: "none",
          mb: 2,
        }}
      >
        404
      </Typography>
      <Typography
        variant="h5"
        sx={{
          fontWeight: 600,
          color: "text.primary",
        }}
      >
        Page not found
      </Typography>
      <Typography
        sx={{
          mt: 1.5,
          mb: 4,
          color: "text.secondary",
          textAlign: "center",
          maxWidth: 380,
          lineHeight: 1.6,
        }}
      >
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
        Let&apos;s get you back on track.
      </Typography>
      <Link href="/" style={{ textDecoration: "none" }}>
        <Button variant="contained" color="primary">
          Back to Home
        </Button>
      </Link>
      <Box
        sx={{
          position: "absolute",
          bottom: 40,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <Box sx={{ width: 32, height: 1, bgcolor: "divider" }} />
        <Typography
          variant="caption"
          sx={{
            color: "text.disabled",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Pass-hive
        </Typography>
        <Box sx={{ width: 32, height: 1, bgcolor: "divider" }} />
      </Box>
    </Box>
  );
}

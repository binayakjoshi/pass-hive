"use client";

import Link from "next/link";
import {
  AppBar,
  Box,
  Button,
  Card,
  Chip,
  Container,
  Divider,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import VpnKeyOutlinedIcon from "@mui/icons-material/VpnKeyOutlined";
import MarkEmailReadOutlinedIcon from "@mui/icons-material/MarkEmailReadOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import RestoreOutlinedIcon from "@mui/icons-material/RestoreOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import CreditCardOutlinedIcon from "@mui/icons-material/CreditCardOutlined";
import StickyNote2OutlinedIcon from "@mui/icons-material/StickyNote2Outlined";
import TerminalOutlinedIcon from "@mui/icons-material/TerminalOutlined";
import LoginOutlinedIcon from "@mui/icons-material/LoginOutlined";
import VpnKeyIcon from "@mui/icons-material/VpnKey";

import { useUser } from "@/context/user-context"; // adjust to your actual UserContext path

const FEATURES = [
  {
    icon: ShieldOutlinedIcon,
    title: "True zero-knowledge",
    description:
      "Your master password never leaves your device, and pass-hive's servers never see a decryption key. Not even we can read your vault.",
  },
  {
    icon: VpnKeyOutlinedIcon,
    title: "Argon2id key derivation",
    description:
      "Your master key is derived client-side with Argon2id, the same memory-hard algorithm recommended for password hashing — run entirely in your browser via WebAssembly.",
  },
  {
    icon: LockOutlinedIcon,
    title: "AES-256 everywhere",
    description:
      "Every vault item — including titles — is encrypted with AES-256-GCM before it ever touches the network, with a fresh random IV for every single encryption.",
  },
  {
    icon: MarkEmailReadOutlinedIcon,
    title: "Email-verified logins",
    description:
      "A one-time code is sent to your inbox on login, adding a second factor on top of your master password without any extra app to install.",
  },
  {
    icon: CategoryOutlinedIcon,
    title: "Built for every secret",
    description:
      "Logins, cards, secure notes, identities, and SSH keys — one vault, five item types, each with fields tailored to what you're storing.",
  },
  {
    icon: RestoreOutlinedIcon,
    title: "Forgiving by design",
    description:
      "Deleted items and accounts are soft-deleted first, so a mistake or a change of mind has a recovery window before anything is gone for good.",
  },
];

const ITEM_TYPES = [
  { icon: LoginOutlinedIcon, label: "Logins" },
  { icon: CreditCardOutlinedIcon, label: "Cards" },
  { icon: StickyNote2OutlinedIcon, label: "Secure notes" },
  { icon: PersonOutlineOutlinedIcon, label: "Identities" },
  { icon: TerminalOutlinedIcon, label: "SSH keys" },
];

const KEY_HIERARCHY = [
  {
    step: "1",
    title: "Master password → master key",
    description:
      "The moment you type your master password, your browser derives a master key from it using Argon2id. The password itself is never stored.",
  },
  {
    step: "2",
    title: "A random vault key is generated",
    description:
      "A separate AES-256 key is created just once, and it's the key that actually encrypts your vault items — your master key never touches them directly.",
  },
  {
    step: "3",
    title: "The vault key is wrapped",
    description:
      "Your master key encrypts ('wraps') the vault key before it's sent anywhere. Change your master password later, and only this wrapped key needs re-wrapping.",
  },
  {
    step: "4",
    title: "Items are encrypted client-side",
    description:
      "Every title and field is encrypted with the vault key, with its own random IV, before the request leaves your browser. The server only ever stores ciphertext.",
  },
];

function AuthActions({ variant = "hero" }: { variant?: "nav" | "hero" }) {
  const { isAuthenticated, isLoading } = useUser();

  const size = variant === "hero" ? "large" : "medium";

  if (isLoading) {
    return (
      <Button variant="outlined" size={size} disabled>
        Loading…
      </Button>
    );
  }

  if (isAuthenticated) {
    return (
      <Button
        component={Link}
        href="/vault"
        variant="contained"
        size={size}
        startIcon={<VpnKeyIcon />}
      >
        Go to Vault
      </Button>
    );
  }

  return (
    <Stack direction="row" spacing={1.5}>
      <Button component={Link} href="/login" variant="outlined" size={size}>
        Log in
      </Button>
      <Button component={Link} href="/signup" variant="contained" size={size}>
        Sign up free
      </Button>
    </Stack>
  );
}

export default function LandingPage() {
  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      {/* Nav */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: (theme) => alpha(theme.palette.background.paper, 0.8),
          backdropFilter: "blur(10px)",
          color: "text.primary",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Toolbar sx={{ py: 1 }}>
          <Container
            maxWidth="lg"
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: { xs: 0 },
            }}
          >
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <LockOutlinedIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                pass-hive
              </Typography>
            </Stack>
            <AuthActions variant="nav" />
          </Container>
        </Toolbar>
      </AppBar>

      {/* Hero */}
      <Box sx={{ position: "relative", overflow: "hidden" }}>
        <Box
          sx={{
            position: "absolute",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: (theme) =>
              `radial-gradient(circle, ${alpha(
                theme.palette.primary.main,
                0.1,
              )} 0%, transparent 70%)`,
            filter: "blur(90px)",
            top: -200,
            right: -150,
            pointerEvents: "none",
          }}
        />
        <Container
          maxWidth="md"
          sx={{ pt: { xs: 10, md: 14 }, pb: { xs: 8, md: 10 } }}
        >
          <Stack spacing={3} sx={{ alignItems: "center", textAlign: "center" }}>
            <Chip
              label="Zero-knowledge · Client-side encrypted"
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
            <Typography
              component="h1"
              sx={{
                fontSize: "clamp(2.5rem, 6vw, 3.75rem)",
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
              }}
            >
              Your passwords, encrypted{" "}
              <Box
                component="span"
                sx={{
                  background: (theme) =>
                    `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.light} 100%)`,
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                before they ever leave your browser
              </Box>
            </Typography>
            <Typography
              sx={{
                color: "text.secondary",
                maxWidth: 560,
                fontSize: "1.125rem",
                lineHeight: 1.7,
              }}
            >
              pass-hive derives your encryption keys, wraps your vault key, and
              encrypts every item locally. The server only ever sees ciphertext
              — not even we can read what's inside your vault.
            </Typography>
            <Box sx={{ pt: 1 }}>
              <AuthActions variant="hero" />
            </Box>
          </Stack>
        </Container>
      </Box>

      {/* Trust badges */}
      <Container maxWidth="md" sx={{ pb: { xs: 6, md: 8 } }}>
        <Stack
          direction="row"
          spacing={{ xs: 2, sm: 4 }}
          sx={{ justifyContent: "center", flexWrap: "wrap", rowGap: 1.5 }}
        >
          {["Argon2id", "AES-256-GCM", "Zero-knowledge", "Email OTP"].map(
            (label) => (
              <Stack
                key={label}
                direction="row"
                spacing={1}
                sx={{ alignItems: "center" }}
              >
                <ShieldOutlinedIcon
                  sx={{ fontSize: 18, color: "primary.main" }}
                />
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", fontWeight: 600 }}
                >
                  {label}
                </Typography>
              </Stack>
            ),
          )}
        </Stack>
      </Container>

      <Divider sx={{ borderColor: "divider" }} />

      {/* Features */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Stack
          spacing={1.5}
          sx={{ alignItems: "center", textAlign: "center", mb: 6 }}
        >
          <Typography
            component="h2"
            sx={{ fontSize: { xs: "1.75rem", md: "2.25rem" }, fontWeight: 800 }}
          >
            Security that doesn't ask for trust
          </Typography>
          <Typography sx={{ color: "text.secondary", maxWidth: 560 }}>
            Every design decision favors provable privacy over convenience
            shortcuts — here's what that looks like in practice.
          </Typography>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
            },
            gap: 3,
          }}
        >
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <Card
              key={title}
              variant="outlined"
              sx={{
                p: 3,
                height: "100%",
                borderColor: "divider",
                bgcolor: "background.paper",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: (theme) =>
                    `0 12px 24px ${alpha(theme.palette.primary.main, 0.12)}`,
                },
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
                  mb: 2,
                }}
              >
                <Icon sx={{ color: "primary.main" }} />
              </Box>
              <Typography sx={{ fontWeight: 700, mb: 1 }}>{title}</Typography>
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", lineHeight: 1.6 }}
              >
                {description}
              </Typography>
            </Card>
          ))}
        </Box>
      </Container>

      <Divider sx={{ borderColor: "divider" }} />

      {/* Key hierarchy */}
      <Box sx={{ bgcolor: "background.paper" }}>
        <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
          <Stack
            spacing={1.5}
            sx={{ alignItems: "center", textAlign: "center", mb: 6 }}
          >
            <Typography
              component="h2"
              sx={{
                fontSize: { xs: "1.75rem", md: "2.25rem" },
                fontWeight: 800,
              }}
            >
              How your data stays yours
            </Typography>
            <Typography sx={{ color: "text.secondary", maxWidth: 620 }}>
              A short chain of keys, entirely computed in your browser, stands
              between your master password and every secret you store.
            </Typography>
          </Stack>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" },
              gap: 3,
            }}
          >
            {KEY_HIERARCHY.map(({ step, title, description }, index) => (
              <Box key={step} sx={{ position: "relative" }}>
                <Stack spacing={1.5}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "primary.main",
                      color: "primary.contrastText",
                      fontWeight: 800,
                      fontSize: "1rem",
                    }}
                  >
                    {step}
                  </Box>
                  <Typography sx={{ fontWeight: 700 }}>{title}</Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "text.secondary", lineHeight: 1.6 }}
                  >
                    {description}
                  </Typography>
                </Stack>
                {index < KEY_HIERARCHY.length - 1 && (
                  <Box
                    sx={{
                      display: { xs: "none", md: "block" },
                      position: "absolute",
                      top: 20,
                      right: -28,
                      width: 24,
                      height: "1px",
                      bgcolor: "divider",
                    }}
                  />
                )}
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Item types */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Stack
          spacing={1.5}
          sx={{ alignItems: "center", textAlign: "center", mb: 6 }}
        >
          <Typography
            component="h2"
            sx={{ fontSize: { xs: "1.75rem", md: "2.25rem" }, fontWeight: 800 }}
          >
            One vault, everything you need to secure
          </Typography>
          <Typography sx={{ color: "text.secondary", maxWidth: 560 }}>
            Five item types, each with fields shaped for what they hold — more
            to come.
          </Typography>
        </Stack>

        <Stack
          direction="row"
          spacing={{ xs: 3, sm: 5 }}
          sx={{ justifyContent: "center", flexWrap: "wrap", rowGap: 3 }}
        >
          {ITEM_TYPES.map(({ icon: Icon, label }) => (
            <Stack
              key={label}
              spacing={1.5}
              sx={{ alignItems: "center", width: 96 }}
            >
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                  border: "1px solid",
                  borderColor: (theme) =>
                    alpha(theme.palette.primary.main, 0.2),
                }}
              >
                <Icon sx={{ color: "primary.main", fontSize: 28 }} />
              </Box>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, textAlign: "center" }}
              >
                {label}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Container>

      <Divider sx={{ borderColor: "divider" }} />

      {/* CTA banner */}
      <Container maxWidth="md" sx={{ py: { xs: 8, md: 12 } }}>
        <Card
          elevation={0}
          sx={{
            p: { xs: 4, md: 6 },
            textAlign: "center",
            borderRadius: 4,
            background: (theme) =>
              `linear-gradient(135deg, ${alpha(
                theme.palette.primary.main,
                0.12,
              )} 0%, ${alpha(theme.palette.secondary.main, 0.15)} 100%)`,
          }}
        >
          <Stack spacing={3} sx={{ alignItems: "center" }}>
            <Typography
              component="h2"
              sx={{ fontSize: { xs: "1.5rem", md: "2rem" }, fontWeight: 800 }}
            >
              Ready to lock things down?
            </Typography>
            <Typography sx={{ color: "text.secondary", maxWidth: 480 }}>
              Create an account in a minute — your master password never leaves
              your device, from the very first keystroke.
            </Typography>
            <AuthActions variant="hero" />
          </Stack>
        </Card>
      </Container>

      {/* Footer */}
      <Box sx={{ borderTop: "1px solid", borderColor: "divider" }}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ alignItems: "center", justifyContent: "space-between" }}
          >
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <LockOutlinedIcon sx={{ fontSize: 18, color: "primary.main" }} />
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                pass-hive
              </Typography>
            </Stack>
            <Typography variant="caption" sx={{ color: "text.disabled" }}>
              © {new Date().getFullYear()} pass-hive. Your keys, your data, your
              vault.
            </Typography>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}

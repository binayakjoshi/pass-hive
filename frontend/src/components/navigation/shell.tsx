"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  Box,
  IconButton,
  AppBar,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
  Button,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import type { ReactNode } from "react";
import Sidebar from "./sidebar";
import ThemeToggle from "@/components/theme-toggle";
import UserMenu from "./user-menu";
import { getActivePageInfo } from "./config";
import { useVaultSession } from "@/context/vault-session";
import { LockOutlined } from "@mui/icons-material";

export default function AppShell({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const pathname = usePathname();

  const pageInfo = getActivePageInfo(pathname);
  const { clearVaultKey } = useVaultSession();

  const pageTitle = (
    <Box sx={{ minWidth: 0 }}>
      {pageInfo && (
        <>
          <Typography
            variant="h5"
            sx={{ fontWeight: 600, lineHeight: 1.4 }}
            noWrap
          >
            {pageInfo.label}
          </Typography>
          {pageInfo.parentLabel && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ lineHeight: 1.2 }}
              noWrap
            >
              {pageInfo.parentLabel}
            </Typography>
          )}
        </>
      )}
    </Box>
  );
  return (
    <Box sx={{ display: "flex", minHeight: "100dvh" }}>
      {isMobile ? (
        <>
          <AppBar
            position="fixed"
            elevation={0}
            sx={{
              bgcolor: "background.paper",
              color: "text.primary",
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Toolbar sx={{ justifyContent: "space-between", gap: 1 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  minWidth: 0,
                }}
              >
                <IconButton
                  edge="start"
                  onClick={() => setMobileOpen(true)}
                  aria-label="Open menu"
                >
                  <MenuIcon />
                </IconButton>
                {pageTitle}
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <ThemeToggle />
                <UserMenu />
              </Box>
            </Toolbar>
          </AppBar>
          <Sidebar
            variant="temporary"
            compact={false}
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            onToggleCompact={() => {}}
          />
        </>
      ) : (
        <Sidebar
          variant="permanent"
          compact={compact}
          open
          onClose={() => {}}
          onToggleCompact={() => setCompact((c) => !c)}
        />
      )}
      <Box
        component="main"
        sx={{ flexGrow: 1, minWidth: 0, ...(isMobile && { pt: 8 }) }}
      >
        {!isMobile && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 1,
              px: { sm: 3 },
              pt: 2,
            }}
          >
            {pageTitle}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Button onClick={clearVaultKey}>
                <LockOutlined fontSize="small" sx={{ mr: 1 }} />
                Lock Vault
              </Button>
              <ThemeToggle />
              <UserMenu />
            </Box>
          </Box>
        )}
        <Box sx={{ p: { xs: 2, sm: 3 } }}>{children}</Box>
      </Box>
    </Box>
  );
}

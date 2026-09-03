"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  IconButton,
  Tooltip,
  Typography,
  Divider,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import { navItems, type NavItem } from "./config";

export const DRAWER_WIDTH_EXPANDED = 264;
export const DRAWER_WIDTH_COMPACT = 76;

interface SidebarProps {
  variant: "permanent" | "temporary";
  compact: boolean;
  open: boolean;
  onClose: () => void;
  onToggleCompact: () => void;
}

export default function Sidebar({
  variant,
  compact,
  open,
  onClose,
  onToggleCompact,
}: SidebarProps) {
  const pathname = usePathname();
  const [openGroup, setOpenGroup] = useState<string | null>(
    navItems.find((item) =>
      item.children?.some((c) => c.href && pathname.startsWith(c.href)),
    )?.id ?? null,
  );

  const showLabels = variant === "temporary" || !compact;
  const width = showLabels ? DRAWER_WIDTH_EXPANDED : DRAWER_WIDTH_COMPACT;

  const isActive = (href?: string) => !!href && pathname === href;
  const isGroupActive = (item: NavItem) =>
    item.children?.some((c) => isActive(c.href)) ?? false;

  const handleGroupClick = (item: NavItem) => {
    if (variant === "permanent" && compact) {
      // expand the rail first so the submenu has room to show
      onToggleCompact();
      setOpenGroup(item.id);
      return;
    }
    setOpenGroup((prev) => (prev === item.id ? null : item.id));
  };

  const content = (
    <Box
      sx={{
        width,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflowX: "hidden",
        transition: (t) =>
          t.transitions.create("width", {
            easing: t.transitions.easing.sharp,
            duration: t.transitions.duration.enteringScreen,
          }),
      }}
    >
      <Box
        sx={{
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: showLabels ? "space-between" : "center",
          px: showLabels ? 2 : 0,
        }}
      >
        {showLabels && (
          <Typography
            variant="subtitle1"
            fontWeight={700}
            color="primary.dark"
            noWrap
          >
            🐝 Pass-Hive
          </Typography>
        )}
        {variant === "permanent" && (
          <IconButton size="small" onClick={onToggleCompact}>
            {compact ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        )}
      </Box>

      <Divider />

      <List sx={{ flex: 1, px: 1, py: 1 }}>
        {navItems.map((item) => {
          const hasChildren = !!item.children?.length;
          const active = isActive(item.href) || isGroupActive(item);
          const groupOpen = openGroup === item.id && showLabels;

          const button = (
            <ListItemButton
              component={hasChildren ? "div" : Link}
              href={hasChildren ? undefined : item.href}
              selected={active}
              onClick={hasChildren ? () => handleGroupClick(item) : onClose}
              sx={{
                borderRadius: 1.5,
                mb: 0.5,
                justifyContent: showLabels ? "flex-start" : "center",
                px: showLabels ? 1.5 : 0,
                "&.Mui-selected": {
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  "& .MuiListItemIcon-root": { color: "primary.contrastText" },
                  "&:hover": { bgcolor: "primary.dark" },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: showLabels ? 1.5 : 0,
                  justifyContent: "center",
                  color: active ? "inherit" : "text.secondary",
                }}
              >
                {item.icon}
              </ListItemIcon>
              {showLabels && (
                <ListItemText
                  primary={item.label}
                  slotProps={{ primary: { noWrap: true } }}
                />
              )}
              {hasChildren &&
                showLabels &&
                (groupOpen ? (
                  <ExpandLessIcon fontSize="small" />
                ) : (
                  <ExpandMoreIcon fontSize="small" />
                ))}
            </ListItemButton>
          );

          return (
            <Box key={item.id}>
              {showLabels ? (
                button
              ) : (
                <Tooltip title={item.label} placement="right">
                  {button}
                </Tooltip>
              )}

              {hasChildren && (
                <Collapse in={groupOpen} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding sx={{ pl: 1 }}>
                    {item.children!.map((child) => (
                      <ListItemButton
                        key={child.id}
                        component={Link}
                        href={child.href!}
                        selected={isActive(child.href)}
                        onClick={onClose}
                        sx={{
                          borderRadius: 1.5,
                          mb: 0.5,
                          pl: 3.5,
                          "&.Mui-selected": {
                            bgcolor: "action.selected",
                            color: "primary.dark",
                            fontWeight: 600,
                          },
                        }}
                      >
                        <ListItemIcon
                          sx={{ minWidth: 0, mr: 1.5, color: "text.secondary" }}
                        >
                          {child.icon}
                        </ListItemIcon>
                        <ListItemText primary={child.label} />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              )}
            </Box>
          );
        })}
      </List>
    </Box>
  );

  if (variant === "temporary") {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH_EXPANDED,
            boxSizing: "border-box",
          },
        }}
      >
        {content}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width,
        flexShrink: 0,
        whiteSpace: "nowrap",
        boxSizing: "border-box",
        "& .MuiDrawer-paper": {
          width,
          boxSizing: "border-box",
          borderRight: "1px solid",
          borderColor: "divider",
          overflowX: "hidden",
          transition: (t) =>
            t.transitions.create("width", {
              easing: t.transitions.easing.sharp,
              duration: t.transitions.duration.enteringScreen,
            }),
        },
      }}
    >
      {content}
    </Drawer>
  );
}

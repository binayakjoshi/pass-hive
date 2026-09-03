"use client";

import { useState } from "react";
import type { MouseEvent } from "react";
import {
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Box,
} from "@mui/material";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";

import { useUser } from "@/context/user-context";

export default function UserMenu() {
  const { user, logout } = useUser();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    handleClose();
    await logout();
  };

  const initial = user?.email ? user.email.charAt(0).toUpperCase() : "?";

  return (
    <>
      <IconButton
        onClick={handleOpen}
        size="small"
        aria-label="Account menu"
        aria-controls={open ? "user-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
      >
        <Avatar
          sx={{
            width: 34,
            height: 34,
            bgcolor: "primary.main",
            color: "primary.contrastText",
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          {initial}
        </Avatar>
      </IconButton>

      <Menu
        id="user-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: { minWidth: 200, mt: 1 },
          },
        }}
      >
        {user?.email && (
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="body2" noWrap>
              {user.email}
            </Typography>
          </Box>
        )}
        {user?.email && <Divider />}

        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}

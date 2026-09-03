"use client";

import type { ReactNode } from "react";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import CasinoOutlinedIcon from "@mui/icons-material/CasinoOutlined";
import ImportExportOutlinedIcon from "@mui/icons-material/ImportExportOutlined";
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";

export interface NavItem {
  id: string;
  label: string;
  href?: string;
  icon: ReactNode;
  children?: NavItem[];
}

export const navItems: NavItem[] = [
  {
    id: "vaults",
    label: "Vaults",
    href: "/vaults",
    icon: <LockOutlinedIcon />,
  },
  {
    id: "tools",
    label: "Tools",
    icon: <BuildOutlinedIcon />,
    children: [
      {
        id: "generator",
        label: "Generator",
        href: "/tools/generator",
        icon: <CasinoOutlinedIcon />,
      },
      {
        id: "import-export",
        label: "Import / Export",
        href: "/tools/import-export",
        icon: <ImportExportOutlinedIcon />,
      },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    icon: <SettingsOutlinedIcon />,
    children: [
      {
        id: "appearance",
        label: "Appearance",
        href: "/settings/appearance",
        icon: <PaletteOutlinedIcon />,
      },
      {
        id: "account",
        label: "Account",
        href: "/settings/account",
        icon: <PersonOutlineOutlinedIcon />,
      },
      {
        id: "general",
        label: "General",
        href: "/settings/general",
        icon: <TuneOutlinedIcon />,
      },
    ],
  },
];

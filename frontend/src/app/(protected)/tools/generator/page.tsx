"use client";

import { useState, type ReactNode, type SyntheticEvent } from "react";
import { Box, Paper, Tabs, Tab, Typography, Divider } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ShortTextOutlinedIcon from "@mui/icons-material/ShortTextOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import PasswordGenerator from "@/components/generator/password-generator";
import PassphraseGenerator from "@/components/generator/pass-phrase-generator";
import UsernameGenerator from "@/components/generator/username-generator";

function TabPanel({
  children,
  value,
  index,
}: {
  children: ReactNode;
  value: number;
  index: number;
}) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`generator-tabpanel-${index}`}
      aria-labelledby={`generator-tab-${index}`}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

export default function GeneratorPage() {
  const [tab, setTab] = useState(0);
  const handleChange = (_: SyntheticEvent, newValue: number) =>
    setTab(newValue);

  return (
    <Box
      sx={{
        maxWidth: 720,
        mx: "auto",
        px: { xs: 2, sm: 0 },
        py: { xs: 3, sm: 5 },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.75 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 40,
            height: 40,
            borderRadius: 2,
            bgcolor: "primary.main",
            color: "primary.contrastText",
            flexShrink: 0,
          }}
        >
          <AutoAwesomeOutlinedIcon fontSize="small" />
        </Box>
        <Typography variant="h5">Generator</Typography>
      </Box>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 4, maxWidth: 480 }}
      >
        Create strong, random credentials. Nothing here is saved or sent
        anywhere until you choose to use it.
      </Typography>

      <Paper
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <Tabs
          value={tab}
          onChange={handleChange}
          variant="fullWidth"
          sx={{
            minHeight: 56,
            bgcolor: "background.default",
            "& .MuiTab-root": {
              minHeight: 56,
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.9rem",
              gap: 0.75,
            },
          }}
        >
          <Tab
            icon={<LockOutlinedIcon fontSize="small" />}
            iconPosition="start"
            label="Password"
            id="generator-tab-0"
          />
          <Tab
            icon={<ShortTextOutlinedIcon fontSize="small" />}
            iconPosition="start"
            label="Passphrase"
            id="generator-tab-1"
          />
          <Tab
            icon={<PersonOutlineOutlinedIcon fontSize="small" />}
            iconPosition="start"
            label="Username"
            id="generator-tab-2"
          />
        </Tabs>

        <Divider />

        <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
          <TabPanel value={tab} index={0}>
            <PasswordGenerator />
          </TabPanel>
          <TabPanel value={tab} index={1}>
            <PassphraseGenerator />
          </TabPanel>
          <TabPanel value={tab} index={2}>
            <UsernameGenerator />
          </TabPanel>
        </Box>
      </Paper>
    </Box>
  );
}

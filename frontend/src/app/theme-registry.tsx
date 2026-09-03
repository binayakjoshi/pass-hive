"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ThemeProvider, CssBaseline } from "@mui/material";
import {
  useMemo,
  useState,
  createContext,
  useContext,
  type ReactNode,
} from "react";
import { getTheme } from "./theme";
import { setThemeMode } from "./theme-actions";

type Mode = "light" | "dark";

const ColorModeContext = createContext({
  toggleColorMode: () => {},
});
export const useColorMode = () => useContext(ColorModeContext);

export default function ThemeRegistry({
  children,
  initialMode,
}: {
  children: ReactNode;
  initialMode: Mode;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prev) => {
          const next: Mode = prev === "light" ? "dark" : "light";
          // fire-and-forget: persist to cookie for next SSR pass
          setThemeMode(next);
          return next;
        });
      },
    }),
    [],
  );

  const theme = useMemo(() => getTheme(mode), [mode]);

  return (
    <AppRouterCacheProvider options={{ key: "mui" }}>
      <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </ColorModeContext.Provider>
    </AppRouterCacheProvider>
  );
}

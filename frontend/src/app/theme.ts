import { createTheme, PaletteMode } from "@mui/material";

export const getTheme = (mode: PaletteMode) =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: "#7C9473", // matcha green
        light: "#A3B899",
        dark: "#5A6E52",
        contrastText: "#FFFFFF",
      },
      secondary: {
        main: "#D9C89E", // warm sand, pairs nicely with matcha
      },
      ...(mode === "light"
        ? {
            background: {
              default: "#F7F6F2",
              paper: "#FFFFFF",
            },
          }
        : {
            background: {
              default: "#1B1D18",
              paper: "#242720",
            },
          }),
    },
    shape: {
      borderRadius: 10,
    },
    typography: {
      fontFamily: "var(--font-roboto), Arial, sans-serif",
    },
  });

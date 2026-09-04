"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { Snackbar, Alert, AlertColor } from "@mui/material";

type ToastMessage = {
  key: number;
  message: string;
  severity: AlertColor;
};

const SnackbarContext = createContext<{
  showToast: (message: string, severity?: AlertColor) => void;
} | null>(null);

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<ToastMessage[]>([]);
  const [current, setCurrent] = useState<ToastMessage | null>(null);
  const [open, setOpen] = useState(false);

  const showToast = useCallback(
    (message: string, severity: AlertColor = "success") => {
      setQueue((prev) => [...prev, { key: Date.now(), message, severity }]);
    },
    [],
  );

  // Process queue
  if (queue.length && !current) {
    setCurrent(queue[0]);
    setQueue((prev) => prev.slice(1));
    setOpen(true);
  }

  const handleClose = (_?: unknown, reason?: string) => {
    if (reason === "clickaway") return;
    setOpen(false);
  };

  const handleExited = () => setCurrent(null);

  return (
    <SnackbarContext.Provider value={{ showToast }}>
      {children}
      <Snackbar
        key={current?.key}
        open={open}
        autoHideDuration={4000}
        onClose={handleClose}
        slotProps={{
          transition: { onExited: handleExited },
        }}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleClose}
          severity={current?.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {current?.message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(SnackbarContext);
  if (!ctx) throw new Error("useToast must be used within SnackbarProvider");
  return ctx.showToast;
};

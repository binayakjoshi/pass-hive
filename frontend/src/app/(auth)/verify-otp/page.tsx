"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Stack,
  LinearProgress,
  Fade,
} from "@mui/material";
import MarkEmailReadOutlinedIcon from "@mui/icons-material/MarkEmailReadOutlined";
import { useUser } from "@/context/user-context";
import { useToast } from "@/context/snackbar-context";

const OTP_LENGTH = 6;

function OtpBoxes({
  value,
  onChange,
  onComplete,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onComplete: (v: string) => void;
  disabled: boolean;
}) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(OTP_LENGTH, " ").split("");

  const setDigit = (index: number, char: string) => {
    const next = digits.slice();
    next[index] = char;
    const joined = next.join("").replace(/\s/g, "");
    onChange(joined);
    if (joined.length === OTP_LENGTH) onComplete(joined);
  };

  const handleChange = (index: number, raw: string) => {
    const char = raw.replace(/\D/g, "").slice(-1);
    if (!char) return;
    setDigit(index, char);
    if (index < OTP_LENGTH - 1) inputsRef.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace") {
      if (digits[index].trim()) {
        setDigit(index, " ");
      } else if (index > 0) {
        inputsRef.current[index - 1]?.focus();
        setDigit(index - 1, " ");
      }
      e.preventDefault();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    onChange(pasted);
    if (pasted.length === OTP_LENGTH) {
      onComplete(pasted);
      inputsRef.current[OTP_LENGTH - 1]?.focus();
    } else {
      inputsRef.current[pasted.length]?.focus();
    }
  };

  return (
    <Stack
      direction="row"
      spacing={1.25}
      sx={{ justifyContent: "center" }}
      onPaste={handlePaste}
    >
      {Array.from({ length: OTP_LENGTH }).map((_, i) => (
        <TextField
          key={i}
          inputRef={(el) => (inputsRef.current[i] = el)}
          value={digits[i].trim()}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          disabled={disabled}
          slotProps={{
            htmlInput: {
              inputMode: "numeric",
              maxLength: 1,
              style: {
                textAlign: "center",
                fontSize: "1.5rem",
                padding: "10px 0",
              },
            },
          }}
          sx={{ width: 48 }}
          autoFocus={i === 0}
        />
      ))}
    </Stack>
  );
}

export default function VerifyOtpPage() {
  const router = useRouter();
  const { pendingVerification, setPendingVerification } = useUser();
  const showToast = useToast();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [totalWindow, setTotalWindow] = useState(600);

  useEffect(() => {
    if (!pendingVerification) {
      router.replace("/login");
    }
  }, [pendingVerification, router]);

  useEffect(() => {
    if (!pendingVerification) return;
    const remainingNow = Math.round(
      (pendingVerification.expiresAt - Date.now()) / 1000,
    );
    setTotalWindow((prev) => Math.max(prev, remainingNow, 1));
    const tick = () => {
      const remaining = Math.max(
        0,
        Math.round((pendingVerification.expiresAt - Date.now()) / 1000),
      );
      setSecondsLeft(remaining);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [pendingVerification]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(
      () => setResendCooldown((s) => Math.max(0, s - 1)),
      1000,
    );
    return () => clearInterval(id);
  }, [resendCooldown]);

  const format = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const expiryProgress = Math.max(
    0,
    Math.min(100, (secondsLeft / totalWindow) * 100),
  );
  const expiringSoon = secondsLeft > 0 && secondsLeft <= 60;

  const submitOtp = async (code: string) => {
    if (!pendingVerification || code.length !== OTP_LENGTH) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/auth/verify-otp`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: pendingVerification.email, otp: code }),
        },
      );
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.message ?? "Verification failed");
      }
      setPendingVerification(null);
      showToast("Account verified successfully. Please login to continue.");
      router.push("/login");
    } catch (err: any) {
      showToast(err.message, "error");
      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!pendingVerification) return;
    setResendLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/auth/resend-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: pendingVerification.email }),
        },
      );
      const body = await res.json();
      if (!res.ok) {
        if (body.code === "OTP_COOLDOWN") {
          setResendCooldown(body.data?.cooldown_seconds ?? 60);
          return;
        }
        throw new Error(body.message);
      }
      const newExpiresAt = Date.now() + body.data.otp_expires_in * 1000;
      setPendingVerification({
        email: pendingVerification.email,
        expiresAt: newExpiresAt,
      });
      setTotalWindow(body.data.otp_expires_in);
      setResendCooldown(60);
      setOtp("");
      showToast("A new code has been sent.");
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setResendLoading(false);
    }
  };

  if (!pendingVerification) return null;

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        p: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{ p: 4, maxWidth: 420, width: "100%", borderRadius: 3 }}
      >
        <Stack spacing={1} sx={{ alignItems: "center", mb: 3 }}>
          <MarkEmailReadOutlinedIcon color="primary" sx={{ fontSize: 40 }} />
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Verify your account
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: "center" }}
          >
            Enter the {OTP_LENGTH}-digit code sent to
            <br />
            <Box component="span" sx={{ fontWeight: 600 }} color="text.primary">
              {pendingVerification.email}
            </Box>
          </Typography>
        </Stack>

        <OtpBoxes
          value={otp}
          onChange={setOtp}
          onComplete={submitOtp}
          disabled={loading || secondsLeft === 0}
        />

        <Box sx={{ mt: 3 }}>
          <LinearProgress
            variant="determinate"
            value={expiryProgress}
            color={expiringSoon ? "error" : "primary"}
            sx={{ height: 4, borderRadius: 2 }}
          />
          <Typography
            variant="caption"
            color={secondsLeft === 0 ? "error" : "text.secondary"}
            sx={{ display: "block", textAlign: "center", mt: 0.75 }}
          >
            {secondsLeft > 0
              ? `Code expires in ${format(secondsLeft)}`
              : "Code expired — request a new one"}
          </Typography>
        </Box>

        <Button
          fullWidth
          variant="contained"
          size="large"
          sx={{ mt: 3 }}
          disabled={loading || otp.length !== OTP_LENGTH || secondsLeft === 0}
          onClick={() => submitOtp(otp)}
        >
          {loading ? "Verifying…" : "Verify"}
        </Button>

        <Stack
          direction="row"
          spacing={0.5}
          sx={{ justifyContent: "center", alignItems: "center", mt: 2 }}
        >
          <Typography variant="body2" color="text.secondary">
            Didn't get a code?
          </Typography>
          <Button
            variant="text"
            size="small"
            disabled={resendCooldown > 0 || resendLoading}
            onClick={handleResend}
            sx={{ minWidth: "auto" }}
          >
            {resendLoading
              ? "Sending…"
              : resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : "Resend code"}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}

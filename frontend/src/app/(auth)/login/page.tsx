import Link from "next/link";
import { Typography } from "@mui/material";
import AuthCard from "@/components/auth/auth-card";
import LoginForm from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome back"
      subtitle="Enter your master password to unlock your vault"
      footer={
        <Typography variant="body2" color="text.secondary">
          New to Pass-Hive?{" "}
          <Link href="/signup" style={{ color: "inherit", fontWeight: 600 }}>
            Create a vault
          </Link>
        </Typography>
      }
    >
      <LoginForm />
    </AuthCard>
  );
}

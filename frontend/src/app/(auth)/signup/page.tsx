import Link from "next/link";
import { Typography } from "@mui/material";
import AuthCard from "@/components/auth/auth-card";
import SignupForm from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <AuthCard
      title="Create your vault"
      subtitle="One master password to secure everything else"
      footer={
        <Typography variant="body2" color="text.secondary">
          Already have a vault?{" "}
          <Link href="/login" style={{ color: "inherit", fontWeight: 600 }}>
            Log in
          </Link>
        </Typography>
      }
    >
      <SignupForm />
    </AuthCard>
  );
}

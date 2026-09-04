import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import ThemeRegistry from "./theme-registry";
import { cookies } from "next/headers";
import { VaultSessionProvider } from "@/context/vault-session";
import { UserProvider } from "@/context/user-context";
import { SnackbarProvider } from "@/context/snackbar-context";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "Pass-Hive",
  description: "A secure password manager.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const cookieStore = await cookies();
  const initialMode =
    (cookieStore.get("theme-mode")?.value as "light" | "dark") || "light";
  return (
    <html lang="en" className={roboto.variable}>
      <body>
        <VaultSessionProvider>
          <UserProvider>
            <SnackbarProvider>
              <ThemeRegistry initialMode={initialMode}>
                {children}
              </ThemeRegistry>
            </SnackbarProvider>
          </UserProvider>
        </VaultSessionProvider>
      </body>
    </html>
  );
}

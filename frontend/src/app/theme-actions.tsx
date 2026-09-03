"use server";

import { cookies } from "next/headers";

export async function setThemeMode(mode: "light" | "dark") {
  const cookieStore = await cookies();
  cookieStore.set("theme-mode", mode, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}

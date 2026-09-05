"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type User = {
  id: string;
  email: string;
};

type PendingVerification = { email: string; expiresAt: number } | null;
interface UserContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  pendingVerification: PendingVerification;
  setPendingVerification: (payload: PendingVerification) => void;
  fetchUser: () => void;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingVerification, setPendingVerification] =
    useState<PendingVerification>(null);
  const fetchUser = useCallback(() => {
    void (async () => {
      try {
        setIsLoading(true);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/users/me`,
          {
            credentials: "include",
          },
        );

        if (!res.ok) {
          setUser(null);
          return;
        }

        const resData = await res.json();
        setUser(resData);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/auth/logout`,
        {
          credentials: "include",
          method: "POST",
        },
      );
      if (res.ok) {
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <UserContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        fetchUser,
        logout,
        pendingVerification,
        setPendingVerification,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser must be used within UserProvider");
  }
  return ctx;
}

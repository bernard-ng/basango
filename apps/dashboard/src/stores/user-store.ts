"use client";

import type { RouterOutputs } from "@basango/api/trpc/routers/_app";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type SessionUser = RouterOutputs["auth"]["session"];

type UserState = {
  user: SessionUser | null;
  setUser: (user: SessionUser | null) => void;
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      setUser: (user) => set({ user }),
      user: null,
    }),
    {
      name: "basango/user",
      partialize: (state) => ({ user: state.user }),
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);

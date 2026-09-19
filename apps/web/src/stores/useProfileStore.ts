import { create } from "zustand";
import type { ProfileSummary } from "@ipp/shared";

interface ProfileStoreState {
  activeProfile: ProfileSummary | null;
  setActiveProfile: (profile: ProfileSummary) => void;
  clearActiveProfile: () => void;
}

export const useProfileStore = create<ProfileStoreState>((set) => ({
  activeProfile: null,
  setActiveProfile: (profile) => set({ activeProfile: profile }),
  clearActiveProfile: () => set({ activeProfile: null }),
}));

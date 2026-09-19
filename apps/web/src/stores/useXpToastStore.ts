import { create } from "zustand";

interface XpToastState {
  visible: boolean;
  amount: number;
  showXpGain: (amount: number) => void;
  hideXpGain: () => void;
}

export const useXpToastStore = create<XpToastState>((set) => ({
  visible: false,
  amount: 0,
  showXpGain: (amount) => set({ visible: true, amount }),
  hideXpGain: () => set({ visible: false, amount: 0 }),
}));

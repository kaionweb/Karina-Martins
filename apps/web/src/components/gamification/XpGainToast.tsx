"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useXpToastStore } from "@/stores/useXpToastStore";

const AUTO_HIDE_MS = 2000;

export function XpGainToast() {
  const { visible, amount, hideXpGain } = useXpToastStore();

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => hideXpGain(), AUTO_HIDE_MS);
    return () => clearTimeout(timer);
  }, [visible, hideXpGain]);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-6 right-6 rounded-full px-4 py-2 font-semibold shadow-lg"
          style={{ backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
          role="status"
        >
          +{amount} XP
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

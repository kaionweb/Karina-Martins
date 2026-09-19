"use client";

import { AnimatePresence, motion } from "framer-motion";

interface PauseOverlayProps {
  visible: boolean;
}

// Aparece somente quando o player está pausado. Fica pinado no topo e é
// pointer-events-none: nunca cobre a marca do YouTube nem os controles/anúncios
// nativos na base do player (CLAUDE.md — "não ocultar anúncios/marca").
export function PauseOverlay({ visible }: PauseOverlayProps) {
  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="pointer-events-none absolute inset-x-0 top-0 flex justify-center pt-3"
          role="status"
        >
          <span className="rounded-cinema-full bg-black/70 px-3 py-1 text-[12px] font-semibold text-white">
            Pausado
          </span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

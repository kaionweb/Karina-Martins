// Wrapper fino (useMemo) sobre computeSeriesAccessStatus de @ipp/shared —
// a MESMA função usada pela API (SeriesService) pra decidir o que cada rota
// de conteúdo libera. Ver access-control.ts em packages/shared/src/lib pra
// a ordem de prioridade das regras (nunca duplicar essa lógica aqui).
"use client";

import { useMemo } from "react";
import {
  computeSeriesAccessStatus,
  type AccessControlItem,
  type AccessControlProfile,
  type AccessControlResult,
  type SeriesLevel,
} from "@ipp/shared";

export function useAccessControl(
  items: AccessControlItem<SeriesLevel>[],
  profile: AccessControlProfile,
  bypass = false,
): AccessControlResult<SeriesLevel> {
  return useMemo(() => computeSeriesAccessStatus(items, profile, bypass), [items, profile, bypass]);
}

import confetti from "canvas-confetti";
import { useEffect } from "react";
import type { ShopItemId } from "../../shared/game";

type ConfettiBurstProps = {
  burstKey?: string;
  skin?: ShopItemId;
};

type ConfettiPreset = {
  colors: string[];
  particleCount: number;
  scalar: number;
  spread: number;
};

const DEFAULT_PRESET: ConfettiPreset = {
  colors: [
    "#538d4e",
    "#b59f3b",
    "#f97316",
    "#f8f8f8",
    "#ef4444",
    "#22d3ee",
    "#a855f7",
    "#ec4899",
    "#3b82f6",
    "#84cc16",
    "#facc15",
    "#14b8a6",
  ],
  particleCount: 95,
  scalar: 1.05,
  spread: 62,
};

const PRESETS: Partial<Record<ShopItemId, ConfettiPreset>> = {
  "confetti-etoiles": {
    colors: ["#facc15", "#fef3c7", "#a855f7", "#ffffff"],
    particleCount: 110,
    scalar: 0.95,
    spread: 72,
  },
  "confetti-smotucoins": {
    colors: ["#facc15", "#f97316", "#fff7ad", "#538d4e"],
    particleCount: 125,
    scalar: 1.12,
    spread: 66,
  },
  "confetti-feux-artifice": {
    colors: ["#ef4444", "#22d3ee", "#a855f7", "#facc15", "#ffffff"],
    particleCount: 140,
    scalar: 1,
    spread: 84,
  },
  "confetti-galaxie": {
    colors: ["#111827", "#7c3aed", "#f0abfc", "#22d3ee", "#ffffff"],
    particleCount: 120,
    scalar: 0.9,
    spread: 78,
  },
  "confetti-pluie-or": {
    colors: ["#facc15", "#fde68a", "#b45309", "#ffffff"],
    particleCount: 150,
    scalar: 1.18,
    spread: 70,
  },
  "confetti-neige": {
    colors: ["#e0f2fe", "#ffffff", "#bae6fd", "#38bdf8"],
    particleCount: 130,
    scalar: 0.85,
    spread: 80,
  },
  "confetti-bulles": {
    colors: ["#22d3ee", "#e0f2fe", "#67e8f9", "#ffffff"],
    particleCount: 120,
    scalar: 0.9,
    spread: 75,
  },
  "confetti-lave": {
    colors: ["#ef4444", "#f97316", "#facc15", "#7c2d12"],
    particleCount: 135,
    scalar: 1.05,
    spread: 68,
  },
  "confetti-emeraude": {
    colors: ["#10b981", "#a7f3d0", "#34d399", "#065f46"],
    particleCount: 120,
    scalar: 1,
    spread: 70,
  },
  "confetti-or-rose": {
    colors: ["#fb7185", "#fda4af", "#facc15", "#fff1f2"],
    particleCount: 145,
    scalar: 1.1,
    spread: 72,
  },
};

function fireSide(
  originX: number,
  angle: number,
  delay: number,
  preset: ConfettiPreset,
) {
  window.setTimeout(() => {
    void confetti({
      angle,
      colors: preset.colors,
      decay: 0.9,
      disableForReducedMotion: true,
      drift: originX <= 0 ? 0.35 : -0.35,
      gravity: 0.9,
      origin: { x: originX, y: 1 },
      particleCount: preset.particleCount,
      scalar: preset.scalar,
      spread: preset.spread,
      startVelocity: 48,
      ticks: 240,
    });
  }, delay);
}

export function ConfettiBurst({ burstKey, skin }: ConfettiBurstProps) {
  useEffect(() => {
    if (!burstKey) {
      return;
    }
    const preset = (skin && PRESETS[skin]) || DEFAULT_PRESET;

    fireSide(0, 58, 0, preset);
    fireSide(1, 122, 0, preset);
    fireSide(0, 64, 140, preset);
    fireSide(1, 116, 140, preset);
  }, [burstKey, skin]);

  return null;
}

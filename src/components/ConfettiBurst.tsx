import confetti from "canvas-confetti";
import { useEffect } from "react";

type ConfettiBurstProps = {
  burstKey?: string;
};

const COLORS = [
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
];

function fireSide(originX: number, angle: number, delay: number) {
  window.setTimeout(() => {
    void confetti({
      angle,
      colors: COLORS,
      decay: 0.9,
      disableForReducedMotion: true,
      drift: originX <= 0 ? 0.35 : -0.35,
      gravity: 0.9,
      origin: { x: originX, y: 1 },
      particleCount: 95,
      scalar: 1.05,
      spread: 62,
      startVelocity: 48,
      ticks: 240,
    });
  }, delay);
}

export function ConfettiBurst({ burstKey }: ConfettiBurstProps) {
  useEffect(() => {
    if (!burstKey) {
      return;
    }

    fireSide(0, 58, 0);
    fireSide(1, 122, 0);
    fireSide(0, 64, 140);
    fireSide(1, 116, 140);
  }, [burstKey]);

  return null;
}

import { useCallback, useEffect, useRef, useState } from "react";
import {
  axialToPixel,
  axialToRingIdx,
  hexCorners,
  hexesUpToRing,
  pixelToAxial,
  type RingCoord,
} from "@/hex/hexGrid";

const BG_COLOR = "#000000";
const IDLE_COLOR = "#22c55e";
const SELECTED_COLOR = "#facc15";
const TEXT_COLOR = "#ffffff";

const MIN_HEX_SIZE = 30;
const MAX_HEX_SIZE = 46;

interface Layout {
  width: number;
  height: number;
  size: number;
  centerX: number;
  centerY: number;
  maxRing: number;
}

function computeLayout(width: number, height: number): Layout {
  const size = Math.max(MIN_HEX_SIZE, Math.min(MAX_HEX_SIZE, Math.min(width, height) / 9));
  const maxRing = Math.ceil((Math.max(width, height) / 2 + size) / (1.5 * size)) + 1;
  return {
    width,
    height,
    size,
    centerX: width / 2,
    centerY: height / 2,
    maxRing,
  };
}

function hexKey(coord: RingCoord): string {
  return `${coord.ring}:${coord.idx}`;
}

function fitsFully(cx: number, cy: number, size: number, layout: Layout): boolean {
  for (const [x, y] of hexCorners(cx, cy, size)) {
    if (x < 0 || x > layout.width || y < 0 || y > layout.height) return false;
  }
  return true;
}

export default function HexGridCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawnKeysRef = useRef<Set<string>>(new Set());
  const [dims, setDims] = useState({ width: 0, height: 0 });
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const update = () => setDims({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || dims.width === 0 || dims.height === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(dims.width * dpr);
    canvas.height = Math.round(dims.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const layout = computeLayout(dims.width, dims.height);
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, layout.width, layout.height);

    const drawn = new Set<string>();
    for (const { ring, idx, axial } of hexesUpToRing(layout.maxRing)) {
      const { x, y } = axialToPixel(axial, layout.size);
      const cx = layout.centerX + x;
      const cy = layout.centerY + y;
      if (!fitsFully(cx, cy, layout.size, layout)) continue;

      const key = hexKey({ ring, idx });
      drawn.add(key);
      const isSelected = selected.has(key);
      const corners = hexCorners(cx, cy, layout.size);

      ctx.beginPath();
      ctx.moveTo(corners[0][0], corners[0][1]);
      for (let i = 1; i < 6; i++) ctx.lineTo(corners[i][0], corners[i][1]);
      ctx.closePath();

      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.strokeStyle = isSelected ? SELECTED_COLOR : IDLE_COLOR;
      if (isSelected) {
        ctx.shadowColor = SELECTED_COLOR;
        ctx.shadowBlur = 10;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      if (isSelected) {
        const label = `(${ring},${idx})`;
        const fontSize = Math.max(11, Math.round(layout.size * 0.42));
        ctx.font = `600 ${fontSize}px ui-sans-serif, system-ui, sans-serif`;
        ctx.fillStyle = TEXT_COLOR;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, cx, cy);
      }
    }
    drawnKeysRef.current = drawn;
  }, [dims, selected]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const layout = computeLayout(rect.width, rect.height);
      const x = event.clientX - rect.left - layout.centerX;
      const y = event.clientY - rect.top - layout.centerY;
      const coord = axialToRingIdx(pixelToAxial(x, y, layout.size));
      const key = hexKey(coord);
      if (!drawnKeysRef.current.has(key)) return;
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }
        return next;
      });
    },
    []
  );

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 h-full w-full touch-none select-none"
      style={{ display: "block" }}
      onPointerDown={handlePointerDown}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}

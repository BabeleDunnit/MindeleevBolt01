import * as THREE from "three";
import { HEX_SIZE } from "@/hex/hexWorld";

export const COLORS = {
  background: 0x000000,
  idle: 0x22c55e,
  selected: 0xfacc15,
  text: 0xffffff,
};

// Flat-top hexagon outline on the ground plane (y=0), in local space.
export const HEX_OUTLINE_GEOMETRY = (() => {
  const h = (HEX_SIZE * Math.sqrt(3)) / 2;
  const pts = [
    new THREE.Vector3(HEX_SIZE, 0, 0),
    new THREE.Vector3(HEX_SIZE / 2, 0, h),
    new THREE.Vector3(-HEX_SIZE / 2, 0, h),
    new THREE.Vector3(-HEX_SIZE, 0, 0),
    new THREE.Vector3(-HEX_SIZE / 2, 0, -h),
    new THREE.Vector3(HEX_SIZE / 2, 0, -h),
  ];
  return new THREE.BufferGeometry().setFromPoints(pts);
})();

export function makeTextSprite(text: string, scale = 6): THREE.Sprite {
  const canvas = document.createElement("canvas");
  const fontPx = 48;
  const measuringCtx = canvas.getContext("2d")!;
  measuringCtx.font = `600 ${fontPx}px ui-sans-serif, system-ui, sans-serif`;
  const width = Math.ceil(measuringCtx.measureText(text).width + 16);
  canvas.width = width;
  canvas.height = fontPx + 16;
  const ctx = canvas.getContext("2d")!;
  ctx.font = `600 ${fontPx}px ui-sans-serif, system-ui, sans-serif`;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  const aspect = canvas.width / canvas.height;
  sprite.scale.set(scale * aspect, scale, 1);
  return sprite;
}

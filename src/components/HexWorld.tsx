import * as THREE from "three";
import { useEffect, useRef } from "react";
import { axialToRingIdx, pixelToAxial } from "@/hex/hexGrid";
import { HEX_SIZE, hexKey, hexesInWorld, keyToCoord } from "@/hex/hexWorld";
import { COLORS, HEX_OUTLINE_GEOMETRY, makeTextSprite } from "@/three/hexFactory";
import {
  applyCamera,
  createDefaultCameraState,
  rayToGroundPoint,
  screenToGroundRay,
  type CameraState,
} from "@/three/cameraRig";
import { clamp } from "@/utils/math";

export default function HexWorld() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<CameraState>(createDefaultCameraState());
  const selectedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(COLORS.background, 1);
    container.appendChild(renderer.domElement);
    renderer.domElement.style.touchAction = "none";
    renderer.domElement.style.display = "block";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.5, 6000);

    // --- Build the hex grid world -------------------------------------------
    const gridGroup = new THREE.Group();
    const labelGroup = new THREE.Group();
    const labelMap = new Map<string, THREE.Sprite>();
    const lineMap = new Map<string, THREE.Line>();

    const idleMaterial = new THREE.LineBasicMaterial({ color: COLORS.idle });
    const selectedMaterial = new THREE.LineBasicMaterial({ color: COLORS.selected });

    for (const { coord, pos } of hexesInWorld()) {
      const line = new THREE.Line(HEX_OUTLINE_GEOMETRY, idleMaterial);
      line.position.set(pos.x, 0, pos.y);
      gridGroup.add(line);
      lineMap.set(hexKey(coord), line);
    }
    scene.add(gridGroup, labelGroup);

    const refreshSelectionVisuals = () => {
      for (const [key, line] of lineMap) {
        const sel = selectedRef.current.has(key);
        line.material = sel ? selectedMaterial : idleMaterial;
        if (sel && !labelMap.has(key)) {
          const coord = keyToCoord(key);
          const sprite = makeTextSprite(`(${coord.ring},${coord.idx})`, 7);
          sprite.position.set(line.position.x, 1, line.position.z);
          labelGroup.add(sprite);
          labelMap.set(key, sprite);
        } else if (!sel && labelMap.has(key)) {
          const sprite = labelMap.get(key)!;
          labelGroup.remove(sprite);
          sprite.material.map?.dispose();
          sprite.material.dispose();
          labelMap.delete(key);
        }
      }
    };

    // --- Resize ---------------------------------------------------------------
    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);

    // --- Input ---------------------------------------------------------------
    const activePointers = new Map<number, { x: number; y: number }>();
    let pinchStartDist = 0;
    let pinchStartZoom = 0;

    const getNdc = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      return {
        x: ((clientX - rect.left) / rect.width) * 2 - 1,
        y: -((clientY - rect.top) / rect.height) * 2 + 1,
      };
    };

    const groundPointFromScreen = (clientX: number, clientY: number): THREE.Vector2 => {
      const ndc = getNdc(clientX, clientY);
      const ray = screenToGroundRay(ndc.x, ndc.y, camera);
      return rayToGroundPoint(ray);
    };

    const pickHex = (clientX: number, clientY: number): string | null => {
      const ground = groundPointFromScreen(clientX, clientY);
      // Ground (x, z) maps to the 2D hex pixel layout directly (x, y).
      const axial = pixelToAxial(ground.x, ground.y, HEX_SIZE);
      const coord = axialToRingIdx(axial);
      const key = hexKey(coord);
      return lineMap.has(key) ? key : null;
    };

    // Change zoom while keeping the world point under (clientX, clientY) fixed
    // on screen — the pinch midpoint or the mouse cursor.
    const setZoomAnchored = (newZoom: number, clientX: number, clientY: number) => {
      const before = groundPointFromScreen(clientX, clientY);
      stateRef.current.zoom = clamp(newZoom, 0, 1);
      applyCamera(camera, stateRef.current, camera.aspect);
      const after = groundPointFromScreen(clientX, clientY);
      stateRef.current.panX += before.x - after.x;
      stateRef.current.panZ += before.y - after.y;
    };

    const dom = renderer.domElement;

    const onPointerDown = (e: PointerEvent) => {
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      dom.setPointerCapture(e.pointerId);
      if (activePointers.size === 2) {
        const [a, b] = [...activePointers.values()];
        pinchStartDist = Math.hypot(a.x - b.x, a.y - b.y);
        pinchStartZoom = stateRef.current.zoom;
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const prev = activePointers.get(e.pointerId);
      if (!prev) return;
      if (activePointers.size === 1 && e.buttons > 0) {
        // Single-pointer pan: convert screen delta to ground-space drag.
        const from = groundPointFromScreen(prev.x, prev.y);
        const to = groundPointFromScreen(e.clientX, e.clientY);
        const dx = from.x - to.x;
        const dy = from.y - to.y;
        stateRef.current.panX += dx;
        stateRef.current.panZ += dy;
      }
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (activePointers.size === 2) {
        const [a, b] = [...activePointers.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinchStartDist > 0) {
          const midX = (a.x + b.x) / 2;
          const midY = (a.y + b.y) / 2;
          const ratio = dist / pinchStartDist;
          setZoomAnchored(pinchStartZoom + Math.log2(ratio) / 4, midX, midY);
        }
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      const prev = activePointers.get(e.pointerId);
      const wasSingle = activePointers.size === 1;
      activePointers.delete(e.pointerId);
      if (activePointers.size < 2) pinchStartDist = 0;
      const moved = prev ? Math.hypot(e.clientX - prev.x, e.clientY - prev.y) : 0;
      if (wasSingle && moved < 6) {
        const key = pickHex(e.clientX, e.clientY);
        if (key) {
          if (selectedRef.current.has(key)) selectedRef.current.delete(key);
          else selectedRef.current.add(key);
          refreshSelectionVisuals();
        }
      }
      if (dom.hasPointerCapture(e.pointerId)) dom.releasePointerCapture(e.pointerId);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY * 0.0012;
      setZoomAnchored(stateRef.current.zoom + delta, e.clientX, e.clientY);
    };

    dom.addEventListener("pointerdown", onPointerDown);
    dom.addEventListener("pointermove", onPointerMove);
    dom.addEventListener("pointerup", onPointerUp);
    dom.addEventListener("pointercancel", onPointerUp);
    dom.addEventListener("wheel", onWheel, { passive: false });
    dom.addEventListener("contextmenu", (e) => e.preventDefault());

    // --- Render loop ----------------------------------------------------------
    let raf = 0;
    const animate = () => {
      applyCamera(camera, stateRef.current, camera.aspect);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      dom.removeEventListener("pointerdown", onPointerDown);
      dom.removeEventListener("pointermove", onPointerMove);
      dom.removeEventListener("pointerup", onPointerUp);
      dom.removeEventListener("pointercancel", onPointerUp);
      dom.removeEventListener("wheel", onWheel);
      renderer.dispose();
      container.removeChild(dom);
    };
  }, []);

  return <div ref={containerRef} className="fixed inset-0 touch-none select-none" />;
}

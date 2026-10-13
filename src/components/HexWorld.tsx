import * as THREE from "three";
import { useEffect, useRef } from "react";
import { axialToRingIdx, pixelToAxial, type RingCoord } from "@/hex/hexGrid";
import { HEX_SIZE, hexKey, hexesInWorld } from "@/hex/hexWorld";
import { COLORS, HEX_OUTLINE_GEOMETRY, makeTextSprite, PLACEHOLDER_GEOMETRY } from "@/three/hexFactory";
import {
  applyCamera,
  createDefaultCameraState,
  rayToGroundPoint,
  screenToGroundRay,
  type CameraState,
} from "@/three/cameraRig";
import { polytronGeometry, dnaPalette } from "@/polytron/polytron";
import { intToRecipe, cellCode, FACE_BUDGET } from "@/polytron/mapping";
import { ensureInterestingRanks, interestingCodeAt, interestingRankCount } from "@/polytron/interesting";
import { clamp } from "@/utils/math";

// Palette sets the catalog cycles through. Each set maps a cell's palette
// slot (0-9) onto a contiguous bank of ten palettes in the PALETTES table.
export const PALETTE_SETS = [
  { id: "mineral", label: "Mineral 00-09", offset: 0 },
  { id: "neon", label: "Neon 10-19", offset: 10 },
  { id: "hue-shift", label: "Hue Shift 20-29", offset: 20 },
  { id: "analogous", label: "Analogous 30-39", offset: 30 },
  { id: "wave", label: "Wave 40-49", offset: 40 },
  { id: "split-comp", label: "Split Complement 50-59", offset: 50 },
] as const;

export type PaletteSetId = (typeof PALETTE_SETS)[number]["id"];

export default function HexWorld({
  paletteSetId,
  clearSignal,
  interestingMode,
}: {
  paletteSetId: PaletteSetId;
  clearSignal: number;
  interestingMode: boolean;
}) {
  const paletteSet = PALETTE_SETS.find((s) => s.id === paletteSetId) ?? PALETTE_SETS[0];
  const clearSelectionRef = useRef<() => void>(() => {});
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<CameraState>(createDefaultCameraState());
  const selectedRef = useRef<Set<string>>(new Set());

  useEffect(() => {    const container = containerRef.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(COLORS.background, 1);
    container.appendChild(renderer.domElement);
    renderer.domElement.style.touchAction = "none";
    renderer.domElement.style.display = "block";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.5, 6000);

    // --- Lighting: ambient fill plus key/rim directional lights --------------
    const ambient = new THREE.HemisphereLight(0xbfd4ff, 0x30281e, 0.55);
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
    keyLight.position.set(40, 80, 30);
    const fillLight = new THREE.DirectionalLight(0x88aaff, 0.5);
    fillLight.position.set(-50, 30, -40);
    const rimLight = new THREE.DirectionalLight(0xffd9a0, 0.7);
    rimLight.position.set(0, 20, -80);
    scene.add(ambient, keyLight, fillLight, rimLight);

    // --- Build the hex grid world -------------------------------------------
    const gridGroup = new THREE.Group();
    const labelGroup = new THREE.Group();
    const labelMap = new Map<string, THREE.Sprite>();
    const lineMap = new Map<string, THREE.Line>();

    const idleMaterial = new THREE.LineBasicMaterial({ color: COLORS.idle });
    const selectedMaterial = new THREE.LineBasicMaterial({ color: COLORS.selected });
    const centerMaterial = new THREE.LineBasicMaterial({ color: COLORS.center });

    for (const { coord, pos } of hexesInWorld()) {
      const isCenter = coord.ring === 0;
      const line = new THREE.Line(HEX_OUTLINE_GEOMETRY, isCenter ? centerMaterial : idleMaterial);
      line.position.set(pos.x, 0, pos.y);
      gridGroup.add(line);
      lineMap.set(hexKey(coord), line);
    }
    scene.add(gridGroup, labelGroup);

    // --- Polytrons: one floating pawn per hex ---------------------------------
    // Each cell's polytronic number (ring-major order) picks its recipe. In
    // interesting mode the number addresses the ascending catalog of shapes
    // with >= 2 face-classes instead; the catalog is filled lazily, and any
    // cell whose rank isn't ranked yet renders as a placeholder until the
    // background scan reaches it.

    const polytronGroup = new THREE.Group();
    const shapeCache = new Map<string, { solid: THREE.BufferGeometry; edges: THREE.BufferGeometry }>();
    const dnaByCell = new Map<string, string>();
    const sharedMaterial = new THREE.MeshLambertMaterial({ vertexColors: true });
    const sharedEdgeMaterial = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 });

    // Warm the catalog synchronously with a small time budget so the first
    // cells render instantly; the rest is finished in the background below.
    const cells: Array<{ coord: RingCoord; pos: THREE.Vector2 }> = [];
    for (const { coord, pos } of hexesInWorld()) cells.push({ coord, pos });
    if (interestingMode) ensureInterestingRanks(cells.length, 150);

    const buildCell = ({ coord, pos }: { coord: RingCoord; pos: THREE.Vector2 }): THREE.Group | null => {
      const number = cellCode(coord);
      if (interestingMode && interestingRankCount() <= number) return null; // not ranked yet
      const code = interestingMode ? interestingCodeAt(number)! : number;
      const dna = intToRecipe(code);
      dnaByCell.set(hexKey(coord), dna);
      // Cells sweep palette slots 0-9; the active set picks which bank colors
      // the cell. Vertex colors are baked per geometry, so the cache is keyed
      // by shape AND resolved palette — keying by shape alone would give every
      // palette variant of a shape the first variant's colors.
      const bare = dna.replace(/(\d{2})([TOCID])$/, "$2");
      const effectivePalette = (dnaPalette(dna) % 10) + paletteSet.offset;
      const cacheKey = `${paletteSetId}:${bare}:${effectivePalette}`;
      let geos = shapeCache.get(cacheKey);
      if (!geos) {
        const built = polytronGeometry(dna, () => effectivePalette);
        const triCount = built.solid.getAttribute("position").count / 3;
        // Face-budget valve: recipes whose meshes get huge render as a flat
        // hexagon outline instead, so no cell can stall the world.
        geos =
          triCount > FACE_BUDGET * 2
            ? { solid: PLACEHOLDER_GEOMETRY, edges: PLACEHOLDER_GEOMETRY }
            : built;
        shapeCache.set(cacheKey, geos);
      }
      const group = new THREE.Group();
      const mesh = new THREE.Mesh(geos.solid, sharedMaterial);
      const outline = new THREE.LineSegments(geos.edges, sharedEdgeMaterial);
      group.add(mesh, outline);
      // Float a tiny amount above the grid; scale to fit inside one hex.
      group.position.set(pos.x, 3.5, pos.y);
      group.scale.setScalar(HEX_SIZE * 0.62);
      polytronGroup.add(group);
      return group;
    };

    for (const cell of cells) buildCell(cell);

    // Finish catalog warm-up off the critical path, then fill the cells that
    // were waiting on it.
    let warmupRaf = 0;
    if (interestingMode && interestingRankCount() < cells.length) {
      const fillPending = () => {
        ensureInterestingRanks(cells.length, 60);
        const missing = cells.filter(({ coord }) => {
          const number = cellCode(coord);
          return interestingRankCount() > number && !dnaByCell.has(hexKey(coord));
        });
        for (const cell of missing) buildCell(cell);
        if (interestingRankCount() < cells.length) warmupRaf = requestAnimationFrame(fillPending);
      };
      warmupRaf = requestAnimationFrame(fillPending);
    }
    scene.add(polytronGroup);

    const refreshSelectionVisuals = () => {
      for (const [key, line] of lineMap) {
        const sel = selectedRef.current.has(key);
        line.material = sel ? selectedMaterial : key === "0:0" ? centerMaterial : idleMaterial;
        if (sel && !labelMap.has(key)) {
          const [ring, idx] = key.split(":").map(Number);
          const number = cellCode({ ring, idx });
          const dna = dnaByCell.get(key);
          const text = dna === undefined ? `(unranked)` : `#${number} (${ring},${idx}) ${dna}`;
          const sprite = makeTextSprite(text, 7);
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

    const clearSelection = () => {
      selectedRef.current.clear();
      refreshSelectionVisuals();
    };
    clearSelectionRef.current = clearSelection;

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
    const clock = new THREE.Clock();
    const animate = () => {
      const t = clock.getElapsedTime();
      // Gentle hover bob for the floating Polytrons.
      polytronGroup.children.forEach((child, i) => {
        child.position.y = 3.5 + Math.sin(t * 1.5 + i * 0.7) * 0.4;
      });
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
      shapeCache.forEach((g) => {
        g.solid.dispose();
        g.edges.dispose();
      });
      sharedMaterial.dispose();
      sharedEdgeMaterial.dispose();
      cancelAnimationFrame(warmupRaf);
      renderer.dispose();
      container.removeChild(dom);
    };
  }, [paletteSetId, interestingMode]);

  useEffect(() => {
    if (clearSignal > 0) clearSelectionRef.current();
  }, [clearSignal]);

  return <div ref={containerRef} className="fixed inset-0 touch-none select-none" />;
}

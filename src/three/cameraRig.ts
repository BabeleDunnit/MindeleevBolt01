import * as THREE from "three";
import { clamp } from "@/utils/math";

// Zoom level: 0 = fully zoomed out (top-down map), 1 = fully landed (ground view).

// Camera heights / angles at each extreme.
const TOP_HEIGHT = 900; // high above ground, looking straight down (map view)
const GROUND_HEIGHT = 14; // camera eye height when fully landed
const GROUND_LOOK_AHEAD = 130; // how far ahead of the camera we look when landed
const FOV = 55;

export interface CameraState {
  zoom: number; // 0..1
  panX: number; // world x of the look target center
  panZ: number; // world z of the look target center
}

export function createDefaultCameraState(): CameraState {
  return { zoom: 0, panX: 0, panZ: 0 };
}

function smoothstep(t: number): number {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

// How much of the descent/tilt has happened for a given zoom.
// 0..TILT_START is pure map zoom; TILT_START..1 blends into ground view.
export const TILT_START = 0.45;

export function tiltFactor(zoom: number): number {
  if (zoom <= TILT_START) return 0;
  return smoothstep((zoom - TILT_START) / (1 - TILT_START));
}

export function applyCamera(camera: THREE.PerspectiveCamera, state: CameraState, aspect: number): void {
  camera.fov = FOV;
  camera.aspect = aspect;
  camera.near = 0.5;
  camera.far = 6000;
  camera.updateProjectionMatrix();

  const tilt = tiltFactor(state.zoom);

  // In map mode, "zooming in" just moves the camera lower over the same target.
  // Past TILT_START the descent continues seamlessly into the ground view.
  const mapZoomSpan = 1 / Math.pow(2, 2.2);
  const mapScale = THREE.MathUtils.lerp(1, mapZoomSpan, smoothstep(clamp(state.zoom / TILT_START, 0, 1)));

  // Camera stays directly over the pan target; the look target slides from
  // straight down to the horizon ahead as tilt engages.
  const lookAhead = tilt * GROUND_LOOK_AHEAD;

  const topHeight = TOP_HEIGHT * mapScale;
  const effectiveHeight = THREE.MathUtils.lerp(topHeight, GROUND_HEIGHT, tilt);

  camera.position.set(state.panX, effectiveHeight, state.panZ);
  camera.lookAt(state.panX, 0, state.panZ - lookAhead);

  camera.updateMatrixWorld();
}

export function screenToGroundRay(
  ndcX: number,
  ndcY: number,
  camera: THREE.PerspectiveCamera
): THREE.Ray {
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
  return raycaster.ray;
}

export function rayToGroundPoint(ray: THREE.Ray): THREE.Vector2 {
  // Ground plane is y=0; intersect the ray with it.
  const t = -ray.origin.y / ray.direction.y;
  return new THREE.Vector2(ray.origin.x + t * ray.direction.x, ray.origin.z + t * ray.direction.z);
}
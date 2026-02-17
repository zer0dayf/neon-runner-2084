import { Vector3, CatmullRomCurve3 } from 'three';

export const TRACK_COLOR = '#00f3ff'; // Cyan
export const GRID_COLOR = '#ff0055'; // Pinkish Red for contrast
export const SKY_COLOR = '#050510'; // Deep Dark
export const SUN_COLOR_TOP = '#ffcc00';
export const SUN_COLOR_BOTTOM = '#ff0055';

// Generate a Long Linear Track for Seamless Looping
const points = [];
const SEGMENTS = 2000; // High segment count for smoothness
const LENGTH = 2000; // Track length in units

for (let i = 0; i <= SEGMENTS; i++) {
  const t = i / SEGMENTS; // 0 to 1

  // Linear Movement along Z (Moving forward)
  const z = -t * LENGTH;

  // Winding Path (X) - Using multiples of 2*PI for seamless tangents
  const x = Math.sin(t * Math.PI * 4) * 50 * Math.sin(t * Math.PI * 2);

  // Vertical Waviness (Y)
  const y = Math.sin(t * Math.PI * 6) * 15 + Math.sin(t * Math.PI * 2) * 5;

  points.push(new Vector3(x, y, z));
}

// closed = false creates a start and an end point
export const TRACK_CURVE = new CatmullRomCurve3(points, false, 'catmullrom', 0.05);

export const TUBE_RADIUS = 8;
export const CAMERA_HEIGHT = 3.5;
export const CAMERA_DISTANCE = 9;
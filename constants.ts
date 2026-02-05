import { Vector3, CatmullRomCurve3 } from 'three';

export const TRACK_COLOR = '#00f3ff'; // Cyan
export const GRID_COLOR = '#ff0055'; // Pinkish Red for contrast
export const SKY_COLOR = '#050510'; // Deep Dark
export const SUN_COLOR_TOP = '#ffcc00';
export const SUN_COLOR_BOTTOM = '#ff0055';

// Generate a Linear Track towards the Sun
const points = [];
const SEGMENTS = 2000; // OPTIMIZATION: Reduced from 3000 for 100Hz/120Hz mobile screens
const START_Z = 400;
const END_Z = -1000; // The Sun is here

for (let i = 0; i <= SEGMENTS; i++) {
  const t = i / SEGMENTS; // 0 to 1
  
  // Linear interpolation for Z (Towards the sun)
  const z = START_Z + (END_Z - START_Z) * t;
  
  // Winding Path (Sine waves on X)
  // Frequency increases slightly towards the end for tension
  const x = Math.sin(t * Math.PI * 6) * 60 * Math.sin(t * Math.PI);
  
  // Vertical Waviness
  const y = Math.sin(t * Math.PI * 8) * 20 + Math.sin(t * Math.PI * 2) * 10;

  points.push(new Vector3(x, y, z));
}

// closed = false creates a start and an end point
export const TRACK_CURVE = new CatmullRomCurve3(points, false, 'catmullrom', 0.05);

export const TUBE_RADIUS = 8;
export const CAMERA_HEIGHT = 3.5;
export const CAMERA_DISTANCE = 9;
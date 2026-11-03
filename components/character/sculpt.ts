import { CatmullRomCurve3, Vector3, MathUtils, SphereGeometry, Color, Float32BufferAttribute, BufferGeometry, Group, Mesh, MeshStandardMaterial, DoubleSide, type Material } from "three";

// Continuous, profiled face and tapered sculpting strokes shared by the rig.
const profile = new CatmullRomCurve3([
  [0, -1.4, 0],
  [0.4, -1.33, 0.5],
  [0.73, -1.15, 0.8],
  [0.98, -0.85, 1.02],
  [1.14, -0.45, 1.18],
  [1.2, 0.05, 1.24],
  [1.18, 0.55, 1.22],
  [1.1, 0.98, 1.12],
  [0.84, 1.27, 0.87],
  [0, 1.4, 0]
].map(([x, y, z]) => new Vector3(x, y, z))).getPoints(256);
export function headSection(y: number) {
  const height = MathUtils.clamp(y, -1.4, 1.4);
  let lo = 0, hi = profile.length - 1;
  while (hi - lo > 1) {
    const mid = lo + hi >> 1;
    if (profile[mid].y < height) lo = mid;
    else hi = mid;
  }
  const a = profile[lo], b = profile[hi];
  const t = MathUtils.clamp((height - a.y) / Math.max(1e-5, b.y - a.y), 0, 1);
  return { width: Math.max(0, MathUtils.lerp(a.x, b.x, t)), depth: Math.max(0, MathUtils.lerp(a.z, b.z, t)) };
}
const gaussian = (x: number, y: number, cx: number, cy: number, sx: number, sy: number) => Math.exp(-(((x - cx) / sx) ** 2) - ((y - cy) / sy) ** 2);
export function faceFrontZ(x: number, y: number) {
  const { width, depth } = headSection(y);
  const curvature = Math.max(0, 1 - (x / Math.max(1e-5, width)) ** 2) ** 0.34;
  const nose = 0.18 * gaussian(x, y, 0, -0.03, 0.12, 0.49) + 0.32 * gaussian(x, y, 0, -0.42, 0.17, 0.145) + 0.03 * (gaussian(x, y, 0.15, -0.46, 0.08, 0.09) + gaussian(x, y, -0.15, -0.46, 0.08, 0.09));
  const cheeks = 0.055 * (gaussian(x, y, 0.63, -0.35, 0.32, 0.32) + gaussian(x, y, -0.63, -0.35, 0.32, 0.32));
  const lip = 0.045 * gaussian(x, y, 0, -0.98, 0.27, 0.075);
  const chin = 0.07 * gaussian(x, y, 0, -1.17, 0.45, 0.17);
  return depth * curvature + (nose + cheeks + lip + chin) * curvature;
}
export function facePoint(yaw: number, pitch: number, offset = 0) {
  const y = Math.sin(pitch) * 1.4, section = headSection(y);
  const x = Math.sin(yaw) * section.width, front = Math.cos(yaw) >= 0;
  const z = front ? faceFrontZ(x, y) : -section.depth * Math.abs(Math.cos(yaw));
  return new Vector3(x, y, z).addScaledVector(new Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)), offset);
}
export function createFaceGeometry(skinHex: string, beardHex: string, beard: boolean) {
  const geometry = new SphereGeometry(1, 160, 128), point = new Vector3();
  const skin = new Color(skinHex), hair = new Color(beardHex), color = new Color();
  const colors = [];
  for (let i = 0; i < geometry.attributes.position.count; i++) {
    point.fromBufferAttribute(geometry.attributes.position, i);
    const yaw = Math.atan2(point.x, point.z), pitch = Math.asin(MathUtils.clamp(point.y, -1, 1));
    point.copy(facePoint(yaw, pitch));
    geometry.attributes.position.setXYZ(i, point.x, point.y, point.z);
    const edge = -1.19 + 0.11 * gaussian(Math.abs(point.x), 0, 0.42, 0, 0.09, 1) + 0.055 * gaussian(point.x, 0, 0, 0, 0.14, 1) - 0.025 * Math.cos(point.x * 14);
    const chin = (1 - MathUtils.smoothstep(point.y, edge - 0.015, edge + 0.025)) * (1 - MathUtils.smoothstep(Math.abs(point.x), 0.56, 0.88)) * (1 - MathUtils.smoothstep(Math.abs(yaw), 0.95, 1.4));
    const stubble = 0.11 * (1 - MathUtils.smoothstep(point.y, -0.89, -0.76)) * MathUtils.smoothstep(Math.abs(point.x), 0.62, 0.9) * (1 - MathUtils.smoothstep(Math.abs(yaw), 1.35, 1.5));
    color.lerpColors(skin, hair, beard ? Math.max(chin, stubble) : 0);
    const blush = gaussian(Math.abs(point.x), point.y, 0.66, -0.37, 0.32, 0.3);
    color.multiply(new Color(1, 1 - blush * 0.085, 1 - blush * 0.11));
    const cavity = 0.03 * gaussian(point.x, point.y, 0, -0.59, 0.22, 0.07);
    color.multiplyScalar(1 - cavity);
    colors.push(...color.toArray());
  }
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}
export function sweptGeometry(points: number[][], width: number, depth: number, grooves = 0) {
  const curve = new CatmullRomCurve3(points.map(([x, y, z]) => new Vector3(x, y, z)));
  const steps = 64, sides = 32;
  const positions = [], uvs = [], indices = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, center = curve.getPointAt(t), tangent = curve.getTangentAt(t);
    const normal = new Vector3(-tangent.y, tangent.x, 0).normalize();
    if (normal.lengthSq() < 0.1) normal.set(1, 0, 0);
    const binormal = new Vector3().crossVectors(tangent, normal).normalize();
    const taper = Math.max(1e-4, Math.sin(Math.PI * Math.pow(t, 0.48)) ** 0.55);
    for (let j = 0; j <= sides; j++) {
      const angle = j / sides * Math.PI * 2;
      const ridge = 1 + grooves * Math.cos(angle * 16 + Math.sin(t * 5) * 0.7);
      const p = center.clone().addScaledVector(normal, Math.cos(angle) * width * taper * ridge).addScaledVector(binormal, Math.sin(angle) * depth * taper * ridge);
      positions.push(...p.toArray());
      uvs.push(j / sides, t);
      if (i < steps && j < sides) {
        const a = i * (sides + 1) + j, b = a + sides + 1;
        indices.push(a, a + 1, b, b, a + 1, b + 1);
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
export function createEar(skin: Material, color: string, side: number) {
  const ear = new Group();
  ear.position.set(side * 1.18, -0.28, 0.02);
  ear.rotation.y = side * 0.18;
  const back = new Mesh(new SphereGeometry(1, 32, 24), skin);
  back.scale.set(0.33, 0.43, 0.18);
  const positions = [], colors = [], indices = [];
  const base = new Color(color), tint = new Color();
  for (let ring = 0; ring <= 20; ring++) {
    const r = ring / 20;
    for (let j = 0; j <= 48; j++) {
      const a = j / 48 * Math.PI * 2;
      positions.push(Math.cos(a) * 0.33 * r, Math.sin(a) * 0.43 * r, 0.08 + 0.16 * Math.exp(-(((r - 0.74) / 0.23) ** 2)));
      tint.copy(base).multiplyScalar(0.7 + 0.3 * MathUtils.smoothstep(r, 0.25, 0.8));
      colors.push(...tint.toArray());
      if (ring < 20 && j < 48) {
        const i = ring * 49 + j;
        indices.push(i, i + 49, i + 1, i + 49, i + 50, i + 1);
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const bowl = new Mesh(geometry, new MeshStandardMaterial({ vertexColors: true, roughness: 0.7, side: DoubleSide }));
  ear.name = "SculptedEar";
  ear.add(back, bowl);
  return ear;
}

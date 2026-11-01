import * as THREE from "three";

/** Shared by the live scene and poster export: one linear-to-sRGB conversion. */
export function createCharacterComposite(texture: THREE.Texture) {
  return new THREE.ShaderMaterial({
    transparent: true, depthTest: false, depthWrite: false,
    uniforms: {
      sceneTexture: { value: texture },
      outputDpr: { value: 1 },
      sourceRect: { value: new THREE.Vector4(0, 0, 1, 1) },
      clipCircle: { value: new THREE.Vector3(0, 0, 10000) },
      cover: { value: 1 }, develop: { value: 1 },
    },
    vertexShader: `varying vec2 vUv;
      void main() { vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }`,
    fragmentShader: `
      uniform sampler2D sceneTexture;
      uniform float outputDpr;
      uniform vec4 sourceRect;
      uniform vec3 clipCircle;
      uniform float cover;
      uniform float develop;
      varying vec2 vUv;
      void main() {
        vec2 screen=gl_FragCoord.xy/outputDpr;
        float circle=1.0-smoothstep(clipCircle.z-.75,clipCircle.z+.75,distance(screen,clipCircle.xy));
        if(circle<=0.0) discard;
        vec4 color=texture2D(sceneTexture,(vUv-sourceRect.xy)/sourceRect.zw);
        float grain=fract(sin(dot(floor(screen/2.0),vec2(12.9898,78.233)))*43758.5453);
        float key=(grain+1.0-vUv.y)*.5;
        if(color.a<=.001 || key>=cover) discard;
        // Keep the vanish/photo tricks; ordinary rendering retains shaded color.
        gl_FragColor=vec4(key<develop ? color.rgb : vec3(.008),color.a*circle);
        #include <colorspace_fragment>
      }`,
  });
}

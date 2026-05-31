import { Filter, GlProgram, UniformGroup, type Texture } from "pixi.js";

/** Tune card burn-away destroy here. */
export const BURN_DESTROY = {
  /** Seconds for dissolve 0 → 1. */
  duration: 1.2,
  /** Orange fringe width in noise space (0–1). */
  burnSize: 0.05,
  /** Dissolve noise UV scale; higher = smaller holes (more tiles on the card). */
  noiseScale: 0.8,
  /** Ease-in exponent (2 = quad, 3 = cubic). Higher = slower start, faster finish. */
  easeIn: 1.5,
  burnColor: [1.0, 0.62, 0.38, 1.0] as const,
} as const;

/** Map linear animation progress (0–1) to dissolve value with ease-in. */
export function burnDestroyDissolveAt(linearProgress: number): number {
  const t = Math.min(1, Math.max(0, linearProgress));
  return Math.pow(t, BURN_DESTROY.easeIn);
}

const vertex = `
in vec2 aPosition;
out vec2 vTextureCoord;

uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;

vec4 filterVertexPosition(void) {
    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
    position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0 * uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
    return vec4(position, 0.0, 1.0);
}

void main(void) {
    gl_Position = filterVertexPosition();
    vTextureCoord = aPosition * (uOutputFrame.zw * uInputSize.zw);
}
`;

const fragment = `
in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform sampler2D uDissolveTexture;
uniform float uDissolveValue;
uniform float uBurnSize;
uniform float uNoiseScale;
uniform vec4 uBurnColor;

void main(void) {
    vec4 mainTex = texture(uTexture, vTextureCoord);
    float n = texture(uDissolveTexture, fract(vTextureCoord * uNoiseScale)).r;
    float d = uDissolveValue;

    float burnWidth = uBurnSize * step(0.001, d) * step(d, 0.999);

    // 1 = intact, 0 = eaten away
    float visibility = 1.0 - smoothstep(n - burnWidth, n + burnWidth, d);

    // Burn fringe just ahead of the dissolve front
    float burnMix = smoothstep(n - burnWidth, n, d);
    vec3 rgb = mix(mainTex.rgb, uBurnColor.rgb, burnMix);

    float alpha = mainTex.a * visibility;
    finalColor = vec4(rgb * alpha, alpha);
}
`;

export type BurnDissolveFilter = {
  filter: Filter;
  setDissolve: (value: number) => void;
};

export function createBurnDissolveFilter(dissolveTexture: Texture): BurnDissolveFilter {
  const [r, g, b, a] = BURN_DESTROY.burnColor;
  const burnUniforms = new UniformGroup({
    uDissolveValue: { value: 0, type: "f32" },
    uBurnSize: { value: BURN_DESTROY.burnSize, type: "f32" },
    uNoiseScale: { value: BURN_DESTROY.noiseScale, type: "f32" },
    uBurnColor: { value: new Float32Array([r, g, b, a]), type: "vec4<f32>" },
  });

  const filter = new Filter({
    glProgram: GlProgram.from({ vertex, fragment }),
    padding: 2,
    resources: {
      burnUniforms,
      uDissolveTexture: dissolveTexture.source,
      uDissolveTextureSampler: dissolveTexture.source.style,
    },
  });

  return {
    filter,
    setDissolve(value) {
      burnUniforms.uniforms.uDissolveValue = value;
      burnUniforms.update();
    },
  };
}

import { Filter, GlProgram, UniformGroup } from 'pixi.js';

/** Spectral green tint (#08c7b8) — matches former ISF `tint_color` default. */
const GHOST_TINT_COLOR = new Float32Array([0 / 255, 255 / 255, 208 / 255, 1]);

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
uniform float uInvertAmount;
uniform float uTintAmount;
uniform float uSaturation;
uniform float uBrightness;
uniform float uPulse;
uniform vec4 uTintColor;

void main(void) {
    vec4 src = texture(uTexture, vTextureCoord);
    vec3 rgb = mix(src.rgb, vec3(1.0) - src.rgb, uInvertAmount);

    float luma = dot(rgb, vec3(0.299, 0.587, 0.114));
    vec3 gray = vec3(luma);
    vec3 saturated = mix(gray, rgb, uSaturation);
    vec3 tinted = mix(saturated, saturated * uTintColor.rgb * 1.15, uTintAmount);
    tinted += uTintColor.rgb * 0.06 * uTintAmount;
    float breathe = 1.0 + uPulse * 0.08;
    vec3 outRgb = tinted * uBrightness * breathe;

    float alpha = src.a;
    finalColor = vec4(outRgb * alpha, alpha);
}
`;

export type GhostAuraUniforms = {
  invertAmount: number;
  tintAmount: number;
  saturation: number;
  brightness: number;
  pulse: number;
};

export type GhostAuraFilter = {
  filter: Filter;
  setUniforms: (values: GhostAuraUniforms) => void;
};

export function createGhostAuraFilter(): GhostAuraFilter {
  const ghostUniforms = new UniformGroup({
    uInvertAmount: { value: 1.0, type: 'f32' },
    uTintAmount: { value: 0.72, type: 'f32' },
    uSaturation: { value: 0.35, type: 'f32' },
    uBrightness: { value: 1.02, type: 'f32' },
    uPulse: { value: 0.0, type: 'f32' },
    uTintColor: { value: GHOST_TINT_COLOR, type: 'vec4<f32>' },
  });

  const filter = new Filter({
    glProgram: GlProgram.from({ vertex, fragment }),
    padding: 2,
    resources: { ghostUniforms },
  });

  return {
    filter,
    setUniforms(values) {
      const u = ghostUniforms.uniforms;
      u.uInvertAmount = values.invertAmount;
      u.uTintAmount = values.tintAmount;
      u.uSaturation = values.saturation;
      u.uBrightness = values.brightness;
      u.uPulse = values.pulse;
      ghostUniforms.update();
    },
  };
}

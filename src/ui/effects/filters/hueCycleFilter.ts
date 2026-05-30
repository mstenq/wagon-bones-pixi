import { Filter, GlProgram } from "pixi.js";

const vertex = `
in vec2 aPosition;
out vec2 vTextureCoord;

uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;

vec4 filterVertexPosition(void) {
    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
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
uniform float uHue;
uniform float uStrength;

vec3 hueRotate(vec3 color, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    mat3 m = mat3(
        0.299 + 0.701 * c + 0.168 * s, 0.587 - 0.587 * c + 0.330 * s, 0.114 - 0.114 * c - 0.497 * s,
        0.299 - 0.299 * c - 0.328 * s, 0.587 + 0.413 * c + 0.035 * s, 0.114 - 0.114 * c + 0.292 * s,
        0.299 - 0.300 * c + 1.250 * s, 0.587 - 0.588 * c - 1.050 * s, 0.114 + 0.886 * c - 0.203 * s
    );
    return clamp(m * color, 0.0, 1.0);
}

void main(void) {
    vec4 color = texture(uTexture, vTextureCoord);
    vec3 shifted = hueRotate(color.rgb, uHue);
    finalColor = vec4(mix(color.rgb, shifted, uStrength), color.a);
}
`;

let sharedFilter: Filter | null = null;

export function getHueCycleFilter(): Filter {
  if (!sharedFilter) {
    sharedFilter = new Filter({
      glProgram: GlProgram.from({ vertex, fragment }),
      resources: {
        hueCycleUniforms: {
          uHue: { value: 0, type: "f32" },
          uStrength: { value: 0.35, type: "f32" },
        },
      },
    });
  }
  return sharedFilter;
}

export function setHueCycleUniforms(filter: Filter, hue: number, strength = 0.35): void {
  const group = filter.resources.hueCycleUniforms as { uHue: { value: number }; uStrength: { value: number } };
  group.uHue.value = hue;
  group.uStrength.value = strength;
}

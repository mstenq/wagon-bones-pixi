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
uniform float uOffset;
uniform float uStrength;

void main(void) {
    vec2 off = vec2(uOffset * uStrength, 0.0);
    float r = texture(uTexture, vTextureCoord + off).r;
    float g = texture(uTexture, vTextureCoord).g;
    float b = texture(uTexture, vTextureCoord - off).b;
    float a = texture(uTexture, vTextureCoord).a;
    finalColor = vec4(r, g, b, a);
}
`;

let sharedFilter: Filter | null = null;

export function getChromaticAberrationFilter(): Filter {
  if (!sharedFilter) {
    sharedFilter = new Filter({
      glProgram: GlProgram.from({ vertex, fragment }),
      resources: {
        chromaUniforms: {
          uOffset: { value: 0.004, type: "f32" },
          uStrength: { value: 1, type: "f32" },
        },
      },
    });
  }
  return sharedFilter;
}

export function setChromaticUniforms(filter: Filter, offset: number, strength = 1): void {
  const group = filter.resources.chromaUniforms as {
    uOffset: { value: number };
    uStrength: { value: number };
  };
  group.uOffset.value = offset;
  group.uStrength.value = strength;
}

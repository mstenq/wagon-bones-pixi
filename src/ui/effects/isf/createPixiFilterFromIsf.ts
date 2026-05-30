import { Filter, GlProgram, UniformGroup } from "pixi.js";

import { parseIsf } from "@/ui/effects/isf/parseIsf";
import {
  buildIsfUniformDeclarations,
  transformIsfBody,
} from "@/ui/effects/isf/transformIsfBody";
import type { IsfInput, IsfPixiFilter, IsfTickContext } from "@/ui/effects/isf/types";

const FILTER_VERTEX = `
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

type ScalarUniform = { value: number; type: "f32" | "i32" };
type Vec2Uniform = { value: Float32Array; type: "vec2<f32>" };
type Vec4Uniform = { value: Float32Array; type: "vec4<f32>" };
type UniformResource = ScalarUniform | Vec2Uniform | Vec4Uniform;

type BuiltInUniforms = {
  TIME: ScalarUniform;
  TIMEDELTA: ScalarUniform;
  FRAMEINDEX: ScalarUniform;
  PASSINDEX: ScalarUniform;
  RENDERSIZE: Vec2Uniform;
  DATE: Vec4Uniform;
};

type UniformStructures = BuiltInUniforms & Record<string, UniformResource>;

type IsfUniformGroup = UniformGroup & {
  uniforms: Record<string, number | Float32Array>;
};

function defaultNumber(input: IsfInput): number {
  if (typeof input.DEFAULT === "number") {
    return input.DEFAULT;
  }
  if (typeof input.DEFAULT === "boolean") {
    return input.DEFAULT ? 1 : 0;
  }
  return 0;
}

function buildUniformResources(inputs: readonly IsfInput[]): UniformStructures {
  const resources: UniformStructures = {
    TIME: { value: 0, type: "f32" },
    TIMEDELTA: { value: 0, type: "f32" },
    FRAMEINDEX: { value: 0, type: "i32" },
    PASSINDEX: { value: 0, type: "i32" },
    RENDERSIZE: { value: new Float32Array([1, 1]), type: "vec2<f32>" },
    DATE: { value: new Float32Array([2026, 1, 1, 0]), type: "vec4<f32>" },
  };

  for (const input of inputs) {
    switch (input.TYPE) {
      case "float":
        resources[input.NAME] = { value: defaultNumber(input), type: "f32" };
        break;
      case "bool":
      case "event":
        resources[input.NAME] = { value: defaultNumber(input), type: "i32" };
        break;
      case "long":
        resources[input.NAME] = { value: defaultNumber(input), type: "i32" };
        break;
      case "color": {
        const color = Array.isArray(input.DEFAULT) ? input.DEFAULT : [0, 0, 0, 1];
        resources[input.NAME] = {
          value: new Float32Array([color[0] ?? 0, color[1] ?? 0, color[2] ?? 0, color[3] ?? 1]),
          type: "vec4<f32>",
        };
        break;
      }
      case "point2D": {
        const point = Array.isArray(input.DEFAULT) ? input.DEFAULT : [0, 0];
        resources[input.NAME] = {
          value: new Float32Array([point[0] ?? 0, point[1] ?? 0]),
          type: "vec2<f32>",
        };
        break;
      }
      default:
        break;
    }
  }

  return resources;
}

function buildFragmentShader(body: string, inputs: readonly IsfInput[]): string {
  const transformedBody = transformIsfBody(body, inputs);
  const userUniforms = buildIsfUniformDeclarations(inputs);

  return `
in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform vec2 RENDERSIZE;
uniform float TIME;
uniform float TIMEDELTA;
uniform int FRAMEINDEX;
uniform int PASSINDEX;
uniform vec4 DATE;
${userUniforms}

${transformedBody}
`;
}

function getUniformGroup(filter: Filter): IsfUniformGroup {
  return filter.resources.isfUniforms as IsfUniformGroup;
}

function setUniformValue(group: IsfUniformGroup, name: string, value: number | boolean | readonly number[]): void {
  if (!(name in group.uniforms)) {
    console.warn(`[isf] No uniform named "${name}"`);
    return;
  }

  if (typeof value === "boolean") {
    group.uniforms[name] = value ? 1 : 0;
    group.update();
    return;
  }

  if (typeof value === "number") {
    group.uniforms[name] = value;
    group.update();
    return;
  }

  const current = group.uniforms[name];
  if (current instanceof Float32Array) {
    for (let i = 0; i < current.length; i++) {
      current[i] = value[i] ?? 0;
    }
    group.update();
  }
}

function dateUniform(now: Date): Float32Array {
  const seconds =
    now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds() + now.getMilliseconds() / 1000;
  return new Float32Array([now.getFullYear(), now.getMonth() + 1, now.getDate(), seconds]);
}

export function createPixiFilterFromIsf(source: string, padding = 4): IsfPixiFilter {
  const parsed = parseIsf(source);
  const uniformResources = buildUniformResources(parsed.inputs);
  const fragment = buildFragmentShader(parsed.body, parsed.inputs);

  const filter = new Filter({
    glProgram: GlProgram.from({ vertex: FILTER_VERTEX, fragment }),
    padding,
    resources: {
      isfUniforms: uniformResources,
    },
  });

  let frameIndex = 0;

  return {
    filter,
    metadata: parsed.metadata,
    inputs: parsed.inputs,
    setValue(name, value) {
      setUniformValue(getUniformGroup(filter), name, value);
    },
    tick(ctx: IsfTickContext) {
      const group = getUniformGroup(filter);
      group.uniforms.TIME = ctx.time;
      group.uniforms.TIMEDELTA = ctx.dt;
      group.uniforms.FRAMEINDEX = frameIndex++;
      group.uniforms.PASSINDEX = 0;

      const renderSize = group.uniforms.RENDERSIZE as Float32Array;
      renderSize[0] = ctx.width;
      renderSize[1] = ctx.height;

      const date = group.uniforms.DATE as Float32Array;
      const nextDate = dateUniform(new Date());
      date[0] = nextDate[0]!;
      date[1] = nextDate[1]!;
      date[2] = nextDate[2]!;
      date[3] = nextDate[3]!;
      group.update();
    },
  };
}

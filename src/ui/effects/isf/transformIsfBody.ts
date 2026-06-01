import type { IsfInput } from "@/ui/effects/isf/types";

function replaceIsfImageMacros(body: string): string {
  let result = body;

  result = result.replace(/IMG_THIS_NORM_PIXEL\(\s*inputImage\s*\)/g, "texture(uTexture, vTextureCoord)");
  result = result.replace(/IMG_THIS_PIXEL\(\s*inputImage\s*\)/g, "texture(uTexture, vTextureCoord)");
  result = result.replace(
    /IMG_NORM_PIXEL\(\s*([A-Za-z_]\w*)\s*,\s*/g,
    (_match, imageName: string) => `texture(${imageName === "inputImage" ? "uTexture" : imageName}, `,
  );
  result = result.replace(
    /IMG_PIXEL\(\s*([A-Za-z_]\w*)\s*,\s*([\s\S]+?)\)/g,
    (_match, imageName: string, coords: string) =>
      `texture(${imageName === "inputImage" ? "uTexture" : imageName}, (${coords}) / RENDERSIZE)`,
  );
  result = result.replace(
    /IMG_SIZE\(\s*([A-Za-z_]\w*)\s*\)/g,
    (_match, imageName: string) => (imageName === "inputImage" ? "RENDERSIZE" : `${imageName}Size`),
  );

  return result;
}

function rewriteBoolUniformUsage(body: string, boolInputs: readonly IsfInput[]): string {
  let result = body;
  for (const input of boolInputs) {
    const name = input.NAME;
    result = result.replace(new RegExp(`!${name}\\b`, "g"), `(${name} == 0)`);
    result = result.replace(new RegExp(`if\\s*\\(\\s*${name}\\s*\\)`, "g"), `if (${name} != 0)`);
    result = result.replace(new RegExp(`\\(\\s*${name}\\s*\\)\\s*\\?`, "g"), `(${name} != 0) ?`);
  }
  return result;
}

function renameLocalFinalColor(body: string): string {
  if (!/\bvec3\s+finalColor\b/.test(body)) {
    return body;
  }
  return body
    .replace(/\bvec3\s+finalColor\b/g, "vec3 isfColor")
    .replace(/\bfinalColor\b/g, "isfColor");
}

export function transformIsfBody(body: string, inputs: readonly IsfInput[]): string {
  const boolInputs = inputs.filter((input) => input.TYPE === "bool" || input.TYPE === "event");

  let result = body;
  result = renameLocalFinalColor(result);
  result = replaceIsfImageMacros(result);
  result = rewriteBoolUniformUsage(result, boolInputs);
  result = result.replace(/\bisf_FragNormCoord\b/g, "vTextureCoord");
  result = result.replace(/\bisf_FragCoord\b/g, "(vTextureCoord * RENDERSIZE)");
  result = result.replace(/\bgl_FragColor\b/g, "finalColor");
  result = result.replace(/\btexture2D\s*\(/g, "texture(");

  return result;
}

export function buildIsfUniformDeclarations(inputs: readonly IsfInput[]): string {
  const lines: string[] = [];

  for (const input of inputs) {
    if (input.TYPE === "image" && input.NAME === "inputImage") {
      continue;
    }

    switch (input.TYPE) {
      case "image":
        lines.push(`uniform sampler2D ${input.NAME};`);
        lines.push(`uniform vec2 ${input.NAME}Size;`);
        break;
      case "float":
        lines.push(`uniform float ${input.NAME};`);
        break;
      case "bool":
      case "event":
        lines.push(`uniform int ${input.NAME};`);
        break;
      case "long":
        lines.push(`uniform int ${input.NAME};`);
        break;
      case "color":
        lines.push(`uniform vec4 ${input.NAME};`);
        break;
      case "point2D":
        lines.push(`uniform vec2 ${input.NAME};`);
        break;
      default:
        break;
    }
  }

  return lines.join("\n");
}

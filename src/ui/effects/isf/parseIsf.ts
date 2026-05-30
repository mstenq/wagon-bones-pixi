import type { IsfInput, IsfMetadata, ParsedIsf } from "@/ui/effects/isf/types";

const METADATA_PATTERN = /\/\*([\s\S]*?)\*\//;

function inferFilterType(inputs: IsfInput[]): ParsedIsf["filterType"] {
  const hasInputImage = inputs.some((input) => input.TYPE === "image" && input.NAME === "inputImage");
  const hasStartImage = inputs.some((input) => input.TYPE === "image" && input.NAME === "startImage");
  const hasEndImage = inputs.some((input) => input.TYPE === "image" && input.NAME === "endImage");
  const hasProgress = inputs.some((input) => input.TYPE === "float" && input.NAME === "progress");

  if (hasInputImage) {
    return "filter";
  }
  if (hasStartImage && hasEndImage && hasProgress) {
    return "transition";
  }
  return "generator";
}

export function parseIsf(source: string): ParsedIsf {
  const match = METADATA_PATTERN.exec(source);
  if (!match) {
    throw new Error("ISF source is missing a /* ... */ metadata block.");
  }

  let metadata: IsfMetadata;
  try {
    metadata = JSON.parse(match[1] ?? "") as IsfMetadata;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid JSON";
    throw new Error(`ISF metadata JSON is invalid: ${message}`);
  }

  const endIndex = source.indexOf("*/");
  const body = source.slice(endIndex + 2).trim();
  if (!body) {
    throw new Error("ISF source is missing GLSL after metadata.");
  }

  const inputs = metadata.INPUTS ?? [];
  const passes = metadata.PASSES ?? [{}];

  if (passes.length > 1 || passes.some((pass) => pass.TARGET)) {
    throw new Error(
      "Multi-pass ISF effects are not supported yet. Use single-pass filter shaders with inputImage.",
    );
  }

  const unsupportedImages = inputs.filter(
    (input) => input.TYPE === "image" && input.NAME !== "inputImage",
  );
  if (unsupportedImages.length > 0) {
    throw new Error(
      `Unsupported image inputs: ${unsupportedImages.map((input) => input.NAME).join(", ")}. Only inputImage is supported.`,
    );
  }

  const filterType = inferFilterType(inputs);
  if (filterType !== "filter") {
    throw new Error(
      `ISF ${filterType} shaders are not supported yet. Use a filter shader with an inputImage input.`,
    );
  }

  return {
    metadata,
    body,
    credit: metadata.CREDIT,
    description: metadata.DESCRIPTION,
    categories: metadata.CATEGORIES ?? [],
    inputs,
    filterType,
  };
}

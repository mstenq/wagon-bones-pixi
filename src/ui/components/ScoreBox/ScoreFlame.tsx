import { useEffect, useRef, type CSSProperties } from "react";

import type { ScoreBoxVariant } from "@/ui/components/ScoreBox/scoreBoxTypes";
import { scoreBoxVariantTheme } from "@/ui/components/ScoreBox/scoreBoxTheme";
import { clampFlameIntensity } from "@/ui/components/ScoreBox/scoreFlame";

export type ScoreFlameProps = {
  variant: ScoreBoxVariant;
  /** 0-1 intensity from game logic; 0 hides flames. */
  intensity: number;
};

const FLAME_SCROLL_SPEED = 8.5;

const VERTEX_SHADER_SOURCE = `
attribute vec2 aPosition;
varying vec2 vUv;

void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SOURCE = `
precision highp float;

uniform float uTime;
uniform float uAmount;
uniform float uSeed;
uniform vec3 uPrimaryColor;
uniform vec3 uAccentColor;

varying vec2 vUv;

void main() {
  float intensity = min(10.0, uAmount);
  if (intensity < 0.1) {
    gl_FragColor = vec4(0.0);
    return;
  }

  vec2 uv = vec2(vUv.x - 0.5, 0.5 - vUv.y);
  vec2 flooredUv = floor(uv * 60.0) / 60.0;
  vec2 warpedUv = flooredUv;
  warpedUv += warpedUv * 0.01 * (
    sin(-1.123 * flooredUv.x + 0.2 * uTime) *
    cos(5.3332 * flooredUv.y + uTime * 0.931)
  );

  vec2 flameUpVec = vec2(0.0, uTime * ${FLAME_SCROLL_SPEED.toFixed(2)} + 0.9 * uSeed);
  float scaleFac = 7.5 + 3.0 / (2.0 + 2.0 * intensity);
  vec2 sv = warpedUv * scaleFac + flameUpVec;
  float speed = mod(20.781 * uSeed, 100.0) + sin(uTime + uSeed) * cos(uTime * 0.151 + uSeed);
  vec2 sv2 = vec2(0.0);

  for (int i = 0; i < 5; i++) {
    float signFac = mod(float(i), 2.0) > 0.5 ? -1.0 : 1.0;
    sv2 += sv + 0.05 * sv2.yx * signFac + 0.3 * (
      cos(length(sv) * 0.411) +
      0.3344 * sin(length(sv)) -
      0.23 * cos(length(sv))
    );
    sv += 0.5 * vec2(
      cos(cos(sv2.y) + speed * 0.0812) * sin(3.22 + sv2.x - speed * 0.1531),
      sin(-sv2.x * 1.21222 + 0.113785 * speed) * cos(sv2.y * 0.91213 - 0.13582 * speed)
    );
  }

  float smokeRes = max(0.0, (
    (length((sv - flameUpVec) / scaleFac * 5.0) + 0.1 * (length(warpedUv) - 0.5)) *
    (2.0 / (2.0 + intensity * 0.2))
  ));
  smokeRes += max(0.0, 2.0 - 0.3 * intensity) * max(0.0, 2.0 * (warpedUv.y - 0.5) * (warpedUv.y - 0.5));

  if (abs(uv.x) > 0.4) {
    smokeRes += 10.0 * (abs(uv.x) - 0.4);
  }

  vec2 holeVec = (uv - vec2(0.0, 0.1)) * vec2(0.19, 1.0);
  float holeRadius = length(holeVec);
  if (holeRadius < min(0.1, intensity * 0.5) && smokeRes > 1.0) {
    smokeRes += min(8.5, intensity * 10.0) * (holeRadius - 0.1);
  }

  vec3 color = uPrimaryColor;
  float alpha = 1.0;

  if (smokeRes > 1.0) {
    alpha = 0.0;
  } else if (uv.y < 0.12) {
    float yFactor = 0.12 - uv.y;
    color = color * (1.0 - 0.5 * yFactor) + 2.5 * yFactor * uAccentColor;
    color += color * (-2.0 + 0.5 * intensity * smokeRes) * yFactor;
  }

  float heightT = clamp((uv.y + 0.5) / 1.0, 0.0, 1.0);
  float halfWidth = 0.36 + 0.03 * pow(1.0 - heightT, 0.65);
  float edgeMask = smoothstep(halfWidth + 0.04, halfWidth - 0.02, abs(uv.x));
  float verticalMask =
    smoothstep(-0.5, -0.4, uv.y) *
    (1.0 - smoothstep(0.4, 0.5, uv.y));
  alpha *= edgeMask * verticalMask;

  if (alpha <= 0.001) {
    gl_FragColor = vec4(0.0);
    return;
  }

  gl_FragColor = vec4(color, alpha);
}
`;

function toUnit(rgb: readonly [number, number, number]): readonly [number, number, number] {
  return [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255];
}

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) {
    return null;
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

export function ScoreFlame({ variant, intensity }: ScoreFlameProps) {
  const flame = clampFlameIntensity(intensity);
  const amount = flame * 10;
  const id = variant === "points" ? 0 : 1;
  const theme = scoreBoxVariantTheme[variant];
  const primary = toUnit(theme.surfaceRgb);
  const accent = toUnit(variant === "points" ? [186, 231, 255] : [255, 191, 122]);
  const isActive = flame > 0;
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // This effect is required because shader setup and animation depend on WebGL, ResizeObserver, and RAF DOM lifecycles.
  useEffect(() => {
    if (!isActive) {
      return;
    }

    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) {
      return;
    }

    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
    });
    if (!gl) {
      return;
    }

    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);
    if (!vertexShader || !fragmentShader) {
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      return;
    }
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      return;
    }

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const positionBuffer = gl.createBuffer();
    if (!positionBuffer) {
      return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "aPosition");
    const timeLocation = gl.getUniformLocation(program, "uTime");
    const amountLocation = gl.getUniformLocation(program, "uAmount");
    const seedLocation = gl.getUniformLocation(program, "uSeed");
    const primaryLocation = gl.getUniformLocation(program, "uPrimaryColor");
    const accentLocation = gl.getUniformLocation(program, "uAccentColor");

    if (
      positionLocation < 0 ||
      !timeLocation ||
      !amountLocation ||
      !seedLocation ||
      !primaryLocation ||
      !accentLocation
    ) {
      return;
    }

    let rafId = 0;
    let startAt = 0;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const bounds = host.getBoundingClientRect();
      if (bounds.width <= 0 || bounds.height <= 0) {
        return;
      }

      const width = Math.max(1, Math.floor(bounds.width * dpr));
      const height = Math.max(1, Math.floor(bounds.height * dpr));
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${Math.round(width / dpr)}px`;
      canvas.style.height = `${Math.round(height / dpr)}px`;
      gl.viewport(0, 0, width, height);
    };

    const draw = (elapsedSeconds: number) => {
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      gl.uniform1f(timeLocation, elapsedSeconds);
      gl.uniform1f(amountLocation, amount);
      gl.uniform1f(seedLocation, id);
      gl.uniform3f(primaryLocation, primary[0], primary[1], primary[2]);
      gl.uniform3f(accentLocation, accent[0], accent[1], accent[2]);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    const frame = (timestamp: number) => {
      if (!startAt) {
        startAt = timestamp;
      }
      draw((timestamp - startAt) / 1000);
      rafId = window.requestAnimationFrame(frame);
    };

    resize();
    draw(0);

    const observer = new ResizeObserver(resize);
    observer.observe(host);

    rafId = window.requestAnimationFrame(frame);

    return () => {
      observer.disconnect();
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
      gl.deleteBuffer(positionBuffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, [accent, amount, id, isActive, primary]);

  if (!isActive) {
    return null;
  }

  const flameStyle = {
    "--flame-i": flame,
  } as CSSProperties;

  return (
    <div
      ref={hostRef}
      className="score-flame pointer-events-none absolute overflow-visible"
      style={flameStyle}
      aria-hidden
    >
      <canvas ref={canvasRef} className="score-flame__canvas block size-full" />
    </div>
  );
}

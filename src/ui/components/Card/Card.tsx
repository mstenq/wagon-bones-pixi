import { DEG_TO_RAD, type Container, type PerspectiveMesh, type Texture } from "pixi.js";
import { useTick } from "@pixi/react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";

import {
  applyTiltToMesh,
  createUnitCorners,
  pointerToTiltAngles,
  resetMeshCorners,
  type PerspectiveTiltConfig,
} from "@/ui/pixi/perspectiveTilt";

import "@/ui/pixi/extend";

export const DEFAULT_CARD_WIDTH = 150;
export const DEFAULT_CARD_HEIGHT = 210;

const IDLE_DEGREES = 1.5;
const IDLE_SPEED = 1.05;
const TILT_LERP = 0.18;
const IDLE_RETURN_LERP = 0.12;

export type CardProps = {
  texture: Texture | null;
  width?: number;
  height?: number;
  /** Phase offset for idle sway (radians). */
  phase?: number;
  hovered?: boolean;
  dragging?: boolean;
  tiltConfig?: PerspectiveTiltConfig;
};

export type CardHandle = {
  setSquishScale: (scaleX: number, scaleY: number) => void;
  setPointerLocal: (x: number, y: number) => void;
};

/** Visual card only — position via parent `DraggableItem`. */
export const Card = forwardRef<CardHandle, CardProps>(function Card(
  {
    texture,
    width = DEFAULT_CARD_WIDTH,
    height = DEFAULT_CARD_HEIGHT,
    phase = 0,
    hovered = false,
    dragging = false,
    tiltConfig,
  },
  ref,
) {
  const squishRef = useRef<Container | null>(null);
  const idleRef = useRef<Container | null>(null);
  const meshRef = useRef<PerspectiveMesh | null>(null);
  const cornersRef = useRef(createUnitCorners());
  const angleXRef = useRef(0);
  const angleYRef = useRef(0);
  const targetAngleXRef = useRef(0);
  const targetAngleYRef = useRef(0);
  const idleRotationRef = useRef(0);
  const hoveredRef = useRef(hovered);
  const draggingRef = useRef(dragging);

  hoveredRef.current = hovered;
  draggingRef.current = dragging;

  useEffect(() => {
    if (!hovered || dragging) {
      targetAngleXRef.current = 0;
      targetAngleYRef.current = 0;
    }
  }, [dragging, hovered]);

  const corners = useMemo(() => {
    const next = createUnitCorners();
    cornersRef.current = next;
    return next;
  }, [width, height]);

  useImperativeHandle(
    ref,
    () => ({
      setSquishScale(scaleX, scaleY) {
        squishRef.current?.scale.set(scaleX, scaleY);
      },
      setPointerLocal(localX, localY) {
        const { angleX, angleY } = pointerToTiltAngles(localX, localY, tiltConfig);
        targetAngleXRef.current = angleX;
        targetAngleYRef.current = angleY;
      },
    }),
    [tiltConfig],
  );

  const bindMesh = useCallback(
    (node: PerspectiveMesh | null) => {
      meshRef.current = node;
      if (node && texture) {
        resetMeshCorners(node, corners, texture.width, texture.height);
      }
    },
    [corners, texture],
  );

  const texWidth = texture?.width ?? width;
  const texHeight = texture?.height ?? height;
  const meshScaleX = width / texWidth;
  const meshScaleY = height / texHeight;

  useTick(() => {
    const mesh = meshRef.current;
    const idle = idleRef.current;
    const isDragging = draggingRef.current;
    const isHovered = hoveredRef.current && !isDragging;

    if (isHovered) {
      // Pointer move updates targets via setPointerLocal.
    } else {
      targetAngleXRef.current += (0 - targetAngleXRef.current) * IDLE_RETURN_LERP;
      targetAngleYRef.current += (0 - targetAngleYRef.current) * IDLE_RETURN_LERP;
    }

    angleXRef.current += (targetAngleXRef.current - angleXRef.current) * TILT_LERP;
    angleYRef.current += (targetAngleYRef.current - angleYRef.current) * TILT_LERP;

    if (!isDragging && !isHovered) {
      const t = performance.now() / 1000;
      const targetIdle = Math.sin(t * IDLE_SPEED + phase) * IDLE_DEGREES * DEG_TO_RAD;
      idleRotationRef.current += (targetIdle - idleRotationRef.current) * 0.14;
    } else if (isDragging) {
      idleRotationRef.current = 0;
    } else {
      idleRotationRef.current += (0 - idleRotationRef.current) * 0.16;
    }

    if (idle) {
      idle.rotation = isDragging ? 0 : idleRotationRef.current;
    }

    applyTiltToMesh(
      mesh,
      corners,
      angleXRef.current,
      angleYRef.current,
      texWidth,
      texHeight,
      tiltConfig,
    );
  });

  return (
    <pixiContainer ref={squishRef} eventMode="none">
      <pixiContainer ref={idleRef} eventMode="none">
        {texture ? (
          <pixiPerspectiveMesh
            ref={bindMesh}
            texture={texture}
            pivot={{ x: texWidth / 2, y: texHeight / 2 }}
            scale={{ x: meshScaleX, y: meshScaleY }}
            eventMode="none"
          />
        ) : null}
      </pixiContainer>
    </pixiContainer>
  );
});

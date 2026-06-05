import { describe, expect, test } from 'bun:test';
import type { SpritesheetData } from 'pixi.js';

import { normalizeSpritesheetData } from '@/loaders/shared/spritesheet';

describe('normalizeSpritesheetData', () => {
  test('converts TexturePacker array frames to filename-keyed records', () => {
    const data = {
      frames: [
        {
          filename: 'coffee_tin.png',
          frame: { x: 0, y: 0, w: 202, h: 301 },
          rotated: false,
          trimmed: false,
          spriteSourceSize: { x: 0, y: 0, w: 202, h: 301 },
          sourceSize: { w: 202, h: 301 },
        },
      ],
      meta: { scale: 1 },
    } as unknown as SpritesheetData;

    const normalized = normalizeSpritesheetData(data);

    expect(Array.isArray(normalized.frames)).toBe(false);
    expect(normalized.frames['coffee_tin.png']?.frame).toEqual({ x: 0, y: 0, w: 202, h: 301 });
  });

  test('leaves hash-format frames unchanged', () => {
    const data: SpritesheetData = {
      frames: {
        'bless.png': {
          frame: { x: 0, y: 0, w: 202, h: 301 },
        },
      },
      meta: { scale: 1 },
    };

    expect(normalizeSpritesheetData(data)).toBe(data);
  });
});

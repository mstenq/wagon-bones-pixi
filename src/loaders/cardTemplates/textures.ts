import whiteTextTemplate from '@/assets/card-templates/white-text.png';
import { Assets, Texture } from 'pixi.js';

let whiteTextTexture: Texture | null = null;

function preload(): Promise<void> {
  return Assets.load<Texture>({
    alias: 'card-template-white-text',
    src: whiteTextTemplate,
  }).then((texture) => {
    whiteTextTexture = texture;
  });
}

export const cardTemplateTexturesReady = preload();

export function getCardTemplateTexture(templateId: 'white-text'): Texture {
  if (!whiteTextTexture) {
    throw new Error('Card template textures not loaded — await cardTemplateTexturesReady first');
  }
  if (templateId !== 'white-text') {
    return whiteTextTexture;
  }
  return whiteTextTexture;
}

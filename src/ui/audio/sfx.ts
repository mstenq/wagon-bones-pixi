import { SFX_URLS, type SfxId } from '@/loaders/sounds/registry';
import { getAudioPreferences } from '@/game/AudioPreferences';

export type PlaySfxOptions = {
  volume?: number;
};

const templateCache = new Map<SfxId, HTMLAudioElement>();

function getTemplate(id: SfxId): HTMLAudioElement {
  let template = templateCache.get(id);
  if (!template) {
    template = new Audio(SFX_URLS[id]);
    templateCache.set(id, template);
  }
  return template;
}

/** Play a one-shot SFX. Respects stored audio preferences. */
export function playSfx(id: SfxId, options: PlaySfxOptions = {}): void {
  const prefs = getAudioPreferences();
  if (!prefs.sfxEnabled) {
    return;
  }

  const baseVolume = options.volume ?? 1;
  const volume = baseVolume * prefs.sfxVolume;
  if (volume <= 0) {
    return;
  }

  const audio = getTemplate(id).cloneNode(true) as HTMLAudioElement;
  audio.volume = Math.min(1, Math.max(0, volume));
  void audio.play().catch(() => {
    // Autoplay policy or missing asset — ignore.
  });
}

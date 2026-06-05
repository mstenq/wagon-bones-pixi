import { ButtonElement } from '@/ui/components/Button/ButtonElement';
import { NeoSurface } from '@/ui/components/NeoSurface/NeoSurface';

export type OptionsModalProps = {
  onClose: () => void;
};

export function OptionsModal({ onClose }: OptionsModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="options-modal-title"
      onClick={onClose}
    >
      <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <NeoSurface faceClassName="flex flex-col gap-4 p-5">
          <h2 id="options-modal-title" className="font-header m-0 text-2xl text-black">
            Options
          </h2>
          <p className="font-body m-0 text-base text-ui-panel-muted">
            Audio and gameplay preferences will live here in a future update.
          </p>
          <ButtonElement variant="primary" label="Close" onClick={onClose} fullWidth />
        </NeoSurface>
      </div>
    </div>
  );
}

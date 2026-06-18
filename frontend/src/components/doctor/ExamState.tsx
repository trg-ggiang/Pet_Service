import { PixelDogLoader } from "../ui/PixelDogLoader";

export function LoadingState({ text }: { text: string }) {
  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center gap-5 bg-slate-50">
      <PixelDogLoader label={text} size="md" />
    </div>
  );
}

export function ErrorState({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div className="flex h-full min-h-0 items-center justify-center bg-slate-50">
      <div className="bg-white border border-border rounded-2xl p-6 text-center shadow-sm">
        <p className="text-sm font-semibold text-red-500">{message}</p>
        <button
          onClick={onBack}
          className="mt-4 h-9 px-4 rounded-xl border border-border text-sm font-semibold hover:bg-muted"
        >
          Quay lại
        </button>
      </div>
    </div>
  );
}

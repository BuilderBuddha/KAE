interface LoadingIndicatorProps {
  label?: string;
}

export function LoadingIndicator({ label = 'Loading…' }: LoadingIndicatorProps) {
  return (
    <div className="loading-indicator" role="status" aria-live="polite">
      <span className="loading-indicator__spinner" aria-hidden />
      <span>{label}</span>
    </div>
  );
}

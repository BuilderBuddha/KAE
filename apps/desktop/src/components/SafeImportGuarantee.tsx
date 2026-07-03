interface SafeImportGuaranteeProps {
  variant?: 'default' | 'failed';
  reason?: string;
}

export function SafeImportGuarantee({ variant = 'default', reason }: SafeImportGuaranteeProps) {
  return (
    <section
      className={`safe-import${variant === 'failed' ? ' safe-import--failed' : ''}`}
      role="note"
    >
      <h4 className="safe-import__title">Safe Import Guarantee</h4>
      {variant === 'default' ? (
        <p>
          No repository files will be modified until validation succeeds and you explicitly
          confirm the import.
        </p>
      ) : (
        <>
          <p>
            <strong>Repository unchanged.</strong> Validation failed before any writes occurred.
          </p>
          {reason && <p className="safe-import__reason">{reason}</p>}
        </>
      )}
    </section>
  );
}

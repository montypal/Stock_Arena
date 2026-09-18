'use client';

import { useFormStatus } from 'react-dom';

// Submit button that reacts while its form's server action runs: it shows a
// spinner, swaps to `pendingLabel`, and disables itself so a slow network
// can't double-submit (e.g. two buy orders).
export default function SubmitButton({ children, pendingLabel, className = 'btn primary', disabled, ...rest }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={disabled || pending}
      aria-busy={pending ? 'true' : undefined}
      data-pending={pending ? 'true' : undefined}
      {...rest}
    >
      {pending ? <span className="btn-spinner" aria-hidden="true" /> : null}
      <span className="btn-label">{pending && pendingLabel ? pendingLabel : children}</span>
    </button>
  );
}

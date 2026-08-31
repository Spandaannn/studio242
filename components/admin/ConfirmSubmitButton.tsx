"use client";

interface ConfirmSubmitButtonProps {
  children: React.ReactNode;
  confirmMessage: string;
  className?: string;
}

// A plain submit button that asks first — used for delete forms throughout
// the admin panel. Native confirm(), zero dependencies.
export function ConfirmSubmitButton({
  children,
  confirmMessage,
  className,
}: ConfirmSubmitButtonProps) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!confirm(confirmMessage)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}

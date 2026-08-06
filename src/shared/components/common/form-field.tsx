import { CircleAlert } from "lucide-react";
import { Message } from "./message";

export function FormField({
  label,
  htmlFor,
  error,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="text-sm text-neutral tracking-wide"
      >
        {label}
        {required && <span className="text-danger ml-1">*</span>}
      </label>

      <div>{children}</div>

      {error && <span className="flex items-center gap-1 text-danger text-xs tracking-wide mt-1"><CircleAlert size={12} /> {error}</span>}
    </div>
  );
}

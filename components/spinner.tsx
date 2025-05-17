// components/ui/Spinner.tsx
export function Spinner({ size = 32 }: { size?: number }) {
  return (
    <div
      className="animate-spin rounded-full border-4 border-gray-300 border-t-primary"
      style={{ width: size, height: size, borderTopColor: "#3b82f6" }}
      role="status"
      aria-label="Loading"
    />
  );
}

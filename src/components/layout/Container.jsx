import { memo } from "react";

export const Container = memo(function Container({
  children,
  className = "",
  id = "",
}) {
  return (
    <div
      className={`mx-auto max-w-content px-4 sm:px-6 md:px-8 ${className}`}
      id={id}
    >
      {children}
    </div>
  );
});

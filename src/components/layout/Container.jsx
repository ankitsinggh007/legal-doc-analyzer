export const Container = ({ children, className = "" }) => (
  <div className={`mx-auto max-w-content px-4 sm:px-6 md:px-8 ${className}`}>
    {children}
  </div>
);

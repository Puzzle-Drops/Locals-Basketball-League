// Small uppercase pill. `variant`: 'default' | 'accent' | 'dnp' | 'small'.
// Use multiple via space-separated string for combinations (e.g. "accent small").
export default function Pill({ variant = '', children, className = '', ...rest }) {
  const variants = variant
    .split(' ')
    .filter(Boolean)
    .map((v) => v.trim())
    .join(' ');
  return (
    <span className={`pill ${variants} ${className}`.trim()} {...rest}>
      {children}
    </span>
  );
}

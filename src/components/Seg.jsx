// Segmented toggle control. Controlled component.
// `options` is an array of { value, label }.
export default function Seg({ value, onChange, options, className = '' }) {
  return (
    <div className={`seg ${className}`.trim()} data-mode={value}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`seg-btn${opt.value === value ? ' active' : ''}`}
          data-mode={opt.value}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

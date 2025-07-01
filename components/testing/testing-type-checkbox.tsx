interface TestingTypeCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function TestingTypeCheckbox({ label, checked, onChange }: TestingTypeCheckboxProps) {
  return (
    <div className="flex items-center space-x-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border border-primary text-primary focus:ring-2 focus:ring-primary"
      />
      <label className="text-sm font-medium">{label}</label>
    </div>
  );
} 
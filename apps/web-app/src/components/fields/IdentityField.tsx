type Props = {
  label: string;
  value?: string;
};

export function IdentityField({ label, value }: Props) {
  if (value === undefined) return null;
  return (
    <div>
      <h3 className="text-xs font-medium text-muted-foreground">{label}</h3>
      <p className="text-sm font-mono break-all">{value}</p>
    </div>
  );
}

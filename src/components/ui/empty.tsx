export function Empty({
  icon,
  title,
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-gray-30 px-6 py-12 text-center">
      {icon ? <div className="text-gray-50">{icon}</div> : null}
      <h3 className="t-title-xs text-black">{title}</h3>
      {children ? <p className="t-text-m max-w-sm text-gray-60">{children}</p> : null}
    </div>
  );
}

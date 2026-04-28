interface PageShellProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

export function PageShell({
  title,
  description,
  children,
  action,
}: PageShellProps) {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h2>
          {description && (
            <p className="text-sm md:text-base text-muted-foreground">{description}</p>
          )}
        </div>
        {action && <div className="w-full md:w-auto">{action}</div>}
      </div>
      <div className="pt-2 md:pt-4">{children}</div>
    </div>
  );
}

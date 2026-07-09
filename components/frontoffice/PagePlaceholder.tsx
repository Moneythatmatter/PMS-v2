interface PagePlaceholderProps {
  title: string;
  description?: string;
}

export function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return (
    <div className="space-y-2">
      <h1 className="text-lg font-bold text-slate-900 sm:text-xl">{title}</h1>
      <p className="text-xs text-slate-500 sm:text-sm">
        {description ?? "This page is ready to be built out."}
      </p>
    </div>
  );
}

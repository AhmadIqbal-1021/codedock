export function ToolHeader({ icon: Icon, title, description, category }: any) {
  return (
    <header className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-background/60 text-indigo-400">
          <Icon className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {category && (
            <p className="text-sm font-medium text-muted-foreground">{category}</p>
          )}
        </div>
      </div>
      <p className="text-lg leading-relaxed text-muted-foreground">{description}</p>
    </header>
  );
}

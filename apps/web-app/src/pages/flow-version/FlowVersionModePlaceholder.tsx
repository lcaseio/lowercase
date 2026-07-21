export function FlowVersionModePlaceholder({ mode }: { mode: string }) {
  return (
    <div className="p-6 text-muted-foreground">
      {mode} mode isn't built yet -- this is just proving out the routing shell.
    </div>
  );
}

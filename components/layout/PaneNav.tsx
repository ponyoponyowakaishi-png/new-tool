const LINKS = [
  { href: "#pane-1", label: "Pane 1 ポートフォリオ" },
  { href: "#pane-2", label: "Pane 2 規制" },
  { href: "#pane-3", label: "Pane 3 結果" },
  { href: "#pane-4", label: "Pane 4 AI" },
] as const;

export function PaneNav() {
  return (
    <nav
      className="hidden rounded-lg border bg-muted/30 px-3 py-2 md:block"
      aria-label="ペインへジャンプ"
    >
      <ul className="flex flex-wrap gap-3 text-xs">
        {LINKS.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

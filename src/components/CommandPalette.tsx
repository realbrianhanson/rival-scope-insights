import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  LayoutDashboard,
  Target,
  FileText,
  Shield,
  TrendingUp,
  GitCompareArrows,
  Bell,
  Settings,
  Plus,
  Newspaper,
  Sparkles,
  Sun,
  Moon,
  ArrowRight,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useCompetitors } from "@/hooks/useCompetitors";
import { useReports } from "@/hooks/useReports";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  label: string;
  icon: React.ElementType;
  group: string;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddCompetitor?: () => void;
  onGenerateBriefing?: () => void;
  onOpenChat?: () => void;
}

function fuzzyMatch(text: string, query: string): boolean {
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  let qi = 0;
  for (let i = 0; i < lower.length && qi < q.length; i++) {
    if (lower[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

export function CommandPalette({
  open,
  onOpenChange,
  onAddCompetitor,
  onGenerateBriefing,
  onOpenChat,
}: CommandPaletteProps) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { data: competitors } = useCompetitors();
  const { data: reports } = useReports();
  const { data: appSettings } = useAppSettings();
  const appName = appSettings?.app_name || "RivalScope";
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    onOpenChange(false);
    setQuery("");
    setSelectedIndex(0);
  }, [onOpenChange]);

  const go = useCallback(
    (path: string) => {
      close();
      navigate(path);
    },
    [close, navigate]
  );

  const staticItems: CommandItem[] = useMemo(
    () => [
      { id: "nav-dashboard", label: "Go to Dashboard", icon: LayoutDashboard, group: "Navigation", shortcut: "G D", action: () => go("/") },
      { id: "nav-competitors", label: "Go to Competitors", icon: Target, group: "Navigation", shortcut: "G C", action: () => go("/competitors") },
      { id: "nav-reports", label: "Go to Reports", icon: FileText, group: "Navigation", shortcut: "G R", action: () => go("/reports") },
      { id: "nav-battlecards", label: "Go to Battlecards", icon: Shield, group: "Navigation", shortcut: "G B", action: () => go("/battlecards") },
      { id: "nav-gaps", label: "Go to Market Gaps", icon: TrendingUp, group: "Navigation", shortcut: "G M", action: () => go("/market-gaps") },
      { id: "nav-comparisons", label: "Go to Comparisons", icon: GitCompareArrows, group: "Navigation", action: () => go("/comparisons") },
      { id: "nav-alerts", label: "Go to Alerts", icon: Bell, group: "Navigation", shortcut: "G A", action: () => go("/alerts") },
      { id: "nav-settings", label: "Go to Settings", icon: Settings, group: "Navigation", action: () => go("/settings") },
      {
        id: "act-add-competitor",
        label: "Add New Competitor",
        icon: Plus,
        group: "Actions",
        shortcut: "N",
        action: () => { close(); onAddCompetitor?.(); },
      },
      {
        id: "act-briefing",
        label: "Generate Executive Briefing",
        icon: Newspaper,
        group: "Actions",
        action: () => { close(); onGenerateBriefing?.(); },
      },
      {
        id: "act-chat",
        label: `Open Ask ${appName}`,
        icon: Sparkles,
        group: "Actions",
        action: () => { close(); onOpenChat?.(); },
      },
      {
        id: "act-theme",
        label: theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode",
        icon: theme === "dark" ? Sun : Moon,
        group: "Actions",
        action: () => { toggleTheme(); close(); },
      },
    ],
    [go, close, theme, toggleTheme, onAddCompetitor, onGenerateBriefing, onOpenChat]
  );

  const dynamicItems: CommandItem[] = useMemo(() => {
    const items: CommandItem[] = [];
    (competitors ?? [])
      .filter((c) => c.status === "active")
      .forEach((c) => {
        items.push({
          id: `comp-${c.id}`,
          label: c.name,
          icon: ArrowRight,
          group: "Competitors",
          action: () => go(`/competitors/${c.id}`),
        });
      });
    (reports ?? [])
      .slice(0, 5)
      .forEach((r) => {
        items.push({
          id: `rep-${r.id}`,
          label: r.title,
          icon: FileText,
          group: "Recent Reports",
          action: () => go(`/reports/${r.id}`),
        });
      });
    return items;
  }, [competitors, reports, go]);

  const allItems = useMemo(() => [...staticItems, ...dynamicItems], [staticItems, dynamicItems]);

  const filtered = useMemo(() => {
    if (!query.trim()) return allItems;
    return allItems.filter((item) => fuzzyMatch(item.label, query));
  }, [allItems, query]);

  const groups = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    filtered.forEach((item) => {
      if (!map.has(item.group)) map.set(item.group, []);
      map.get(item.group)!.push(item);
    });
    return map;
  }, [filtered]);

  const flatItems = useMemo(() => filtered, [filtered]);

  // Reset selection on query change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Scroll selected into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, flatItems.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        flatItems[selectedIndex]?.action();
      } else if (e.key === "Escape") {
        close();
      }
    },
    [flatItems, selectedIndex, close]
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-[hsl(240,33%,5%/0.7)] backdrop-blur-[8px]"
            onClick={close}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-[560px] mx-4 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onKeyDown={handleKeyDown}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
              <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search commands, competitors, reports..."
                className="flex-1 bg-transparent text-lg text-foreground placeholder:text-muted-foreground outline-none"
              />
              <kbd className="hidden sm:inline-flex text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-[400px] overflow-y-auto py-2">
              {flatItems.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm text-muted-foreground">No results found</p>
                </div>
              ) : (
                Array.from(groups.entries()).map(([group, items]) => {
                  return (
                    <div key={group}>
                      <div className="px-5 pt-3 pb-1.5">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                          {group}
                        </span>
                      </div>
                      {items.map((item) => {
                        const globalIdx = flatItems.indexOf(item);
                        const isSelected = globalIdx === selectedIndex;
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            data-index={globalIdx}
                            onClick={item.action}
                            onMouseEnter={() => setSelectedIndex(globalIdx)}
                            className={cn(
                              "flex items-center gap-3 w-full px-5 py-2.5 text-left transition-colors",
                              isSelected
                                ? "bg-muted/60 border-l-2 border-l-primary"
                                : "border-l-2 border-l-transparent hover:bg-muted/30"
                            )}
                          >
                            <Icon
                              className={cn(
                                "h-4 w-4 flex-shrink-0",
                                isSelected ? "text-primary" : "text-muted-foreground"
                              )}
                            />
                            <span
                              className={cn(
                                "flex-1 text-sm truncate",
                                isSelected ? "text-foreground font-medium" : "text-foreground/80"
                              )}
                            >
                              {item.label}
                            </span>
                            {item.shortcut && (
                              <span className="text-[10px] font-mono text-muted-foreground tracking-wider">
                                {item.shortcut}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-4 px-5 py-2.5 border-t border-border text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <kbd className="font-mono bg-muted px-1 py-0.5 rounded">↑↓</kbd> navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="font-mono bg-muted px-1 py-0.5 rounded">↵</kbd> select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="font-mono bg-muted px-1 py-0.5 rounded">esc</kbd> close
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Global keyboard shortcut hook
export function useCommandPaletteShortcuts({
  onOpen,
  onAddCompetitor,
}: {
  onOpen: () => void;
  onAddCompetitor?: () => void;
}) {
  const navigate = useNavigate();
  const gPendingRef = useRef(false);
  const gTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // Cmd+K / Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpen();
        return;
      }

      // Don't process single-key shortcuts if in input
      if (isInput) return;

      // ? opens palette
      if (e.key === "?") {
        e.preventDefault();
        onOpen();
        return;
      }

      // N opens add competitor
      if (e.key === "n" || e.key === "N") {
        if (!e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault();
          onAddCompetitor?.();
          return;
        }
      }

      // G + letter sequences
      if (e.key === "g" || e.key === "G") {
        if (!gPendingRef.current) {
          gPendingRef.current = true;
          gTimerRef.current = setTimeout(() => {
            gPendingRef.current = false;
          }, 500);
          return;
        }
      }

      if (gPendingRef.current) {
        gPendingRef.current = false;
        clearTimeout(gTimerRef.current);
        const routes: Record<string, string> = {
          d: "/",
          c: "/competitors",
          r: "/reports",
          b: "/battlecards",
          m: "/market-gaps",
          a: "/alerts",
        };
        const route = routes[e.key.toLowerCase()];
        if (route) {
          e.preventDefault();
          navigate(route);
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate, onOpen, onAddCompetitor]);
}

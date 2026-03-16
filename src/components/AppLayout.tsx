import { ReactNode, useState, useCallback } from "react";
import { AppSidebar } from "./AppSidebar";
import { MobileNav } from "./MobileNav";
import { AskRivalScopeButton } from "./AskRivalScopePanel";
import { CommandPalette, useCommandPaletteShortcuts } from "./CommandPalette";
import { AddCompetitorModal } from "./competitors/AddCompetitorModal";

export function AppLayout({ children }: { children: ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [addCompOpen, setAddCompOpen] = useState(false);

  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const openAddComp = useCallback(() => setAddCompOpen(true), []);

  useCommandPaletteShortcuts({
    onOpen: openPalette,
    onAddCompetitor: openAddComp,
  });

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar onOpenPalette={openPalette} />
      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-6 md:py-8">
          {children}
        </div>
      </main>
      <MobileNav />
      <AskRivalScopeButton />
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onAddCompetitor={openAddComp}
      />
      <AddCompetitorModal open={addCompOpen} onOpenChange={setAddCompOpen} />
    </div>
  );
}

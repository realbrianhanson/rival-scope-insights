import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { MobileNav } from "./MobileNav";
import { AskRivalScopeButton } from "./AskRivalScopePanel";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-6 md:py-8">
          {children}
        </div>
      </main>
      <MobileNav />
      <AskRivalScopeButton />
    </div>
  );
}

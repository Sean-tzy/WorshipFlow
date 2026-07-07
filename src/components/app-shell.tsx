import { AnimatePresence, motion } from "framer-motion";
import { Bell, ChevronLeft, Plus, Sparkles } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { navItems } from "../data/workspace";
import { cn } from "../lib/utils";
import { Button } from "./button";
import { CommandPalette } from "./command-palette";

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-ink text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_18%_12%,rgba(139,92,246,0.24),transparent_34%),radial-gradient(circle_at_80%_0%,rgba(56,189,248,0.16),transparent_28%),#09090B]" />
      <motion.aside
        animate={{ width: collapsed ? 86 : 280 }}
        transition={{ type: "spring", stiffness: 250, damping: 30 }}
        className="fixed inset-y-3 left-3 z-30 hidden overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.055] shadow-soft backdrop-blur-2xl lg:block"
      >
        <div className="flex h-full flex-col p-3">
          <div className="flex items-center gap-3 px-3 py-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet via-azure to-mint text-ink shadow-glow">
              <Sparkles className="h-5 w-5" />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <p className="font-display text-lg font-bold">WorshipFlow</p>
                  <p className="text-xs text-zinc-500">City Harvest Church Villamonte</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <nav className="mt-5 flex-1 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === "/app"}
                className={({ isActive }) =>
                  cn(
                    "group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm text-zinc-400 transition hover:bg-white/[0.07] hover:text-white",
                    isActive && "bg-white/[0.09] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]",
                  )
                }
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </nav>
          <button
            onClick={() => setCollapsed((value) => !value)}
            className="mx-auto grid h-10 w-10 place-items-center rounded-full border border-white/10 text-zinc-400 hover:bg-white/10"
          >
            <motion.span animate={{ rotate: collapsed ? 180 : 0 }}>
              <ChevronLeft className="h-4 w-4" />
            </motion.span>
          </button>
        </div>
      </motion.aside>

      <div className={cn("transition-[padding] duration-300 lg:pl-[304px]", collapsed && "lg:pl-[110px]")}>
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/8 bg-ink/70 px-4 py-4 backdrop-blur-2xl md:px-8">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Operator Workspace</p>
            <h1 className="font-display text-xl font-bold md:text-2xl">Sunday Service Command Center</h1>
          </div>
          <div className="flex items-center gap-2">
            <CommandPalette />
            <Button variant="secondary" className="h-11 w-11 px-0" onClick={() => toast.success("No new notifications")}>
              <Bell className="h-4 w-4" />
            </Button>
            <Button onClick={() => navigate("/app/builder")}>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Create</span>
            </Button>
          </div>
        </header>
        <Outlet />
      </div>
    </div>
  );
}

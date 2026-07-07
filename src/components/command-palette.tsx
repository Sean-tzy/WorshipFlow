import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { commandGroups } from "../data/workspace";
import { Button } from "./button";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const groups = useMemo(
    () =>
      commandGroups.map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          `${item.title} ${item.meta}`.toLowerCase().includes(query.toLowerCase()),
        ),
      })),
    [query],
  );

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)} className="hidden md:inline-flex">
        <Search className="h-4 w-4" />
        Search
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-zinc-400">Ctrl K</span>
      </Button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-start bg-black/55 px-4 pt-[12vh] backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              onMouseDown={(event) => event.stopPropagation()}
              className="mx-auto w-full max-w-3xl overflow-hidden rounded-[24px] border border-white/12 bg-[#111113]/95 shadow-soft"
            >
              <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
                <Search className="h-5 w-5 text-zinc-400" />
                <input
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search songs, Bible verses, media, people, service plans..."
                  className="w-full bg-transparent text-base text-white outline-none placeholder:text-zinc-500"
                />
                <button onClick={() => setOpen(false)} className="rounded-full p-2 text-zinc-400 hover:bg-white/10">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="max-h-[58vh] space-y-5 overflow-y-auto p-4">
                {groups.map((group) =>
                  group.items.length ? (
                    <section key={group.label}>
                      <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                        {group.label}
                      </p>
                      <div className="space-y-1">
                        {group.items.map((item) => (
                          <motion.button
                            key={item.title}
                            whileHover={{ x: 4 }}
                            onClick={() => {
                              setOpen(false);
                              if (item.title.includes("song")) navigate("/app/builder");
                              else if (item.title.includes("Bible")) navigate("/app/bible");
                              else if (item.title.includes("service")) navigate("/app/planner");
                              else if (item.title.includes("Media")) navigate("/app/media");
                              else toast.success(`Opened ${item.title}`);
                            }}
                            className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left hover:bg-white/[0.07]"
                          >
                            <span className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.06]">
                              <item.icon className="h-4 w-4 text-mint" />
                            </span>
                            <span>
                              <span className="block text-sm font-medium text-white">{item.title}</span>
                              <span className="text-xs text-zinc-500">{item.meta}</span>
                            </span>
                          </motion.button>
                        ))}
                      </div>
                    </section>
                  ) : null,
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

import { motion } from "framer-motion";
import { EyeOff, Maximize2, Monitor, Pause, Search, SkipBack, SkipForward, TimerReset } from "lucide-react";
import { Button } from "../components/button";
import { MagneticCard, Page } from "../components/motion";
import { slides } from "../data/workspace";
import toast from "react-hot-toast";

export function LivePage() {
  return (
    <Page className="px-4 py-6 md:px-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-red-300">Live Presentation</p>
          <h2 className="font-display text-4xl font-black">Operator mode</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => toast("Black screen enabled")}><EyeOff className="h-4 w-4" /> Black</Button>
          <Button variant="secondary" onClick={() => toast("Blank screen enabled")}><Pause className="h-4 w-4" /> Blank</Button>
          <Button onClick={() => toast.success("Audience output opened")}><Maximize2 className="h-4 w-4" /> Audience</Button>
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <MagneticCard className="grid min-h-[68vh] place-items-center overflow-hidden bg-gradient-to-br from-violet-950 via-sky-900 to-emerald-700 p-10 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
            <p className="font-display text-5xl font-black leading-tight md:text-7xl">All my life You have been faithful</p>
            <p className="mt-8 text-sm uppercase tracking-[0.32em] text-white/60">Current slide</p>
          </motion.div>
        </MagneticCard>
        <div className="space-y-4">
          <MagneticCard className="p-5">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-2xl bg-white/[0.05] p-4"><p className="text-xs text-zinc-500">Timer</p><p className="font-display text-3xl font-bold">18:42</p></div>
              <div className="rounded-2xl bg-white/[0.05] p-4"><p className="text-xs text-zinc-500">Clock</p><p className="font-display text-3xl font-bold">10:31</p></div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => toast("Previous slide")}><SkipBack className="h-4 w-4" /></Button>
              <Button className="flex-1" onClick={() => toast("Next slide")}><SkipForward className="h-4 w-4" /></Button>
            </div>
          </MagneticCard>
          <MagneticCard className="p-5">
            <h3 className="mb-4 font-display text-xl font-bold">Next slide</h3>
            <div className="rounded-2xl bg-gradient-to-br from-cyan-900 to-violet-950 p-5 text-center">
              Your goodness is running after me
            </div>
          </MagneticCard>
          <MagneticCard className="p-5">
            <div className="mb-3 flex items-center gap-2 text-sm text-zinc-400"><Search className="h-4 w-4" /> Quick jump</div>
            <div className="space-y-2">
              {slides.map((slide) => (
                <button key={slide.section} onClick={() => toast.success(`Jumped to ${slide.section}`)} className="w-full rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-3 text-left text-sm hover:bg-white/[0.08]">
                  {slide.section}
                </button>
              ))}
            </div>
          </MagneticCard>
          <MagneticCard className="p-5">
            <p className="mb-2 flex items-center gap-2 text-sm text-mint"><Monitor className="h-4 w-4" /> Confidence monitor</p>
            <p className="text-sm leading-6 text-zinc-500">Large lyric preview and operator notes for stage displays.</p>
          </MagneticCard>
        </div>
      </div>
    </Page>
  );
}

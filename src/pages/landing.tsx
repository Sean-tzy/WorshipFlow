import { motion } from "framer-motion";
import { ArrowRight, Check, Github, Play, Sparkles, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Button } from "../components/button";
import { MagneticCard, Page } from "../components/motion";

const features = [
  "AI lyric splitting and chorus detection",
  "Dual-screen live operator mode",
  "Bible slides from any passage",
  "Motion backgrounds and OBS-ready output",
  "Sunday service planner with drag ordering",
  "Autosave, history, versions, and team activity",
];

export function LandingPage() {
  return (
    <Page className="overflow-hidden bg-ink text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(139,92,246,0.32),transparent_30%),radial-gradient(circle_at_85%_5%,rgba(52,211,153,0.18),transparent_25%),radial-gradient(circle_at_50%_100%,rgba(56,189,248,0.18),transparent_30%),#09090B]" />
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
        <Link to="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-violet via-azure to-mint text-ink">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="font-display text-lg font-bold">WorshipFlow AI</span>
        </Link>
        <div className="hidden items-center gap-7 text-sm text-zinc-400 md:flex">
          <a href="#features">Features</a>
          <a href="#demo">Demo</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">Docs</a>
          <Github className="h-4 w-4" />
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login">
            <Button variant="ghost">Login</Button>
          </Link>
          <Link to="/register">
            <Button>Get Started</Button>
          </Link>
        </div>
      </nav>

      <section className="relative mx-auto grid min-h-[calc(100vh-86px)] max-w-7xl items-center gap-12 px-5 pb-16 pt-12 lg:grid-cols-[1fr_1.08fr]">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div className="mb-6 inline-flex rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-zinc-300 backdrop-blur-xl">
            <Sparkles className="mr-2 h-4 w-4 text-mint" />
            AI-powered worship slides in minutes
          </div>
          <h1 className="max-w-4xl font-display text-5xl font-black leading-[0.95] tracking-[-0.03em] md:text-7xl">
            Build beautiful church presentations without fighting old software.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
            Import songs, split lyrics, design slides, plan services, and run live worship with a fast,
            elegant workspace built for pastors, operators, and worship teams.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/app">
              <Button className="h-12 px-6">
                Launch Workspace <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button variant="secondary" className="h-12 px-6" onClick={() => toast.success("Demo player opened")}>
              <Play className="h-4 w-4" /> Watch Demo
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94, rotateX: 8 }}
          animate={{ opacity: 1, scale: 1, rotateX: 0 }}
          transition={{ duration: 0.8, delay: 0.12 }}
          className="relative"
        >
          <div className="absolute -inset-6 rounded-[36px] bg-gradient-to-br from-violet/30 via-azure/20 to-mint/20 blur-3xl" />
          <div className="relative overflow-hidden rounded-[28px] border border-white/12 bg-[#111113]/82 p-3 shadow-soft backdrop-blur-2xl">
            <div className="rounded-[22px] border border-white/10 bg-black/40 p-4">
              <div className="flex items-center justify-between border-b border-white/8 pb-3">
                <div className="flex gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-400" />
                  <span className="h-3 w-3 rounded-full bg-amber-300" />
                  <span className="h-3 w-3 rounded-full bg-emerald-300" />
                </div>
                <span className="text-xs text-zinc-500">Live: Sunday Morning</span>
              </div>
              <div className="grid gap-4 pt-4 md:grid-cols-[0.78fr_1fr]">
                <div className="space-y-3">
                  {["Verse 1", "Chorus", "Bridge", "Outro"].map((item, index) => (
                    <motion.div
                      key={item}
                      animate={{ opacity: [0.55, 1, 0.55] }}
                      transition={{ repeat: Infinity, duration: 3.2, delay: index * 0.2 }}
                      className="rounded-2xl border border-white/8 bg-white/[0.05] p-4"
                    >
                      <p className="text-sm font-semibold">{item}</p>
                      <p className="mt-1 text-xs text-zinc-500">Goodness of God</p>
                    </motion.div>
                  ))}
                </div>
                <div className="grid min-h-[420px] place-items-center rounded-[22px] bg-gradient-to-br from-violet-950 via-sky-900 to-emerald-700 p-8 text-center shadow-glow">
                  <div>
                    <p className="font-display text-4xl font-black leading-tight">All my life You have been faithful</p>
                    <p className="mt-5 text-sm uppercase tracking-[0.32em] text-white/60">Audience Output</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section id="features" className="mx-auto grid max-w-7xl gap-4 px-5 py-20 md:grid-cols-3">
        {features.map((feature) => (
          <MagneticCard key={feature} className="p-6">
            <Check className="mb-5 h-5 w-5 text-mint" />
            <h3 className="font-display text-xl font-bold">{feature}</h3>
            <p className="mt-3 text-sm leading-6 text-zinc-500">
              Designed for real weekend workflows with fast creation, team collaboration, and operator-grade live controls.
            </p>
          </MagneticCard>
        ))}
      </section>

      <section id="demo" className="mx-auto max-w-7xl px-5 py-16">
        <div className="overflow-hidden rounded-[28px] border border-white/12 bg-white/[0.05] p-4 shadow-soft">
          <div className="grid min-h-[420px] place-items-center rounded-[22px] bg-[radial-gradient(circle_at_50%_20%,rgba(139,92,246,0.4),transparent_35%),linear-gradient(135deg,#111113,#030303)]">
            <Button className="h-16 w-16 rounded-full px-0">
              <Play className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 py-16 md:grid-cols-3">
        {["Media director", "Worship pastor", "Church planter"].map((role) => (
          <MagneticCard key={role} className="p-6">
            <p className="text-sm leading-7 text-zinc-300">
              "WorshipFlow gives our team the polish of a creative suite with the speed we need ten minutes before service."
            </p>
            <p className="mt-5 text-sm font-semibold text-white">{role}</p>
          </MagneticCard>
        ))}
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-5 py-16">
        <MagneticCard className="flex flex-col items-start justify-between gap-8 p-8 md:flex-row md:items-center">
          <div>
            <p className="text-sm text-mint">Launch pricing</p>
            <h2 className="mt-2 font-display text-4xl font-black">Free for small churches. Scale when your team grows.</h2>
          </div>
          <Button onClick={() => toast.success("Free plan selected")}>
            Start free <Zap className="h-4 w-4" />
          </Button>
        </MagneticCard>
      </section>

      <section id="faq" className="mx-auto grid max-w-7xl gap-4 px-5 py-16 md:grid-cols-2">
        {["Does it support OBS?", "Can every section use a different background?", "Can I use Bible verses?", "Is Google login ready?"].map(
          (question) => (
            <MagneticCard key={question} className="p-6">
              <h3 className="font-display text-lg font-bold">{question}</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-500">
                Yes. The architecture is built around presentation outputs, structured slides, and configurable integrations.
              </p>
            </MagneticCard>
          ),
        )}
      </section>

      <footer className="mx-auto flex max-w-7xl flex-col justify-between gap-4 border-t border-white/8 px-5 py-10 text-sm text-zinc-500 md:flex-row">
        <span>WorshipFlow AI</span>
        <span>Built for churches, media teams, and worship leaders.</span>
      </footer>
    </Page>
  );
}

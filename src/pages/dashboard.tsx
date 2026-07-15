import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Activity, CalendarDays, Clock, HardDrive, Play, Plus, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/button";
import { MagneticCard, Page } from "../components/motion";
import { activity, metrics, recentSongs } from "../data/workspace";

const chart = [
  { day: "Mon", slides: 18 },
  { day: "Tue", slides: 34 },
  { day: "Wed", slides: 28 },
  { day: "Thu", slides: 48 },
  { day: "Fri", slides: 54 },
  { day: "Sat", slides: 71 },
  { day: "Sun", slides: 112 },
];

export function DashboardPage() {
  const navigate = useNavigate();
  return (
    <Page className="px-4 py-6 md:px-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MagneticCard key={metric.label} className="p-5">
            <div className="flex items-center justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/[0.07]">
                <metric.icon className="h-5 w-5 text-mint" />
              </span>
              <span className="text-xs text-zinc-500">{metric.delta}</span>
            </div>
            <p className="mt-5 text-sm text-zinc-500">{metric.label}</p>
            <p className="mt-1 font-display text-3xl font-black">{metric.value}</p>
          </MagneticCard>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <MagneticCard className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold">Presentation velocity</h2>
              <p className="text-sm text-zinc-500">Slides created, presented, and updated this week.</p>
            </div>
            <Button variant="secondary" onClick={() => toast.success("Analytics view is ready")}>
              <Activity className="h-4 w-4" /> View analytics
            </Button>
          </div>
          <div className="mt-8 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart}>
                <defs>
                  <linearGradient id="slides" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#34D399" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#71717A", fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "#111113", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16 }} />
                <Area type="monotone" dataKey="slides" stroke="#8B5CF6" fill="url(#slides)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </MagneticCard>

        <MagneticCard className="p-5">
          <h2 className="font-display text-2xl font-bold">Sunday Service</h2>
          <p className="mt-1 text-sm text-zinc-500">July 12, 2026 at 10:00 AM</p>
          <div className="mt-6 space-y-3">
            {["Welcome Loop", "Goodness of God", "Romans 8", "Offering", "Sermon", "Closing Song"].map((item, index) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.04] p-3">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/[0.06] text-xs text-zinc-400">{index + 1}</span>
                <span className="flex-1 text-sm font-medium">{item}</span>
                <Clock className="h-4 w-4 text-zinc-500" />
              </div>
            ))}
          </div>
          <Button className="mt-5 w-full" onClick={() => navigate("/app/planner")}>
            <Play className="h-4 w-4" /> Start rehearsal
          </Button>
        </MagneticCard>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <MagneticCard className="p-5 xl:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold">Recent songs</h2>
            <Button variant="secondary" onClick={() => navigate("/app/builder")}>
              <Plus className="h-4 w-4" /> Add song
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {recentSongs.map((song) => (
              <button key={song.title} onClick={() => navigate("/app/builder")} className="rounded-2xl border border-white/8 bg-white/[0.04] p-4 text-left transition hover:bg-white/[0.07]">
                <div className="h-28 rounded-2xl bg-gradient-to-br from-violet-700 via-sky-700 to-emerald-500" />
                <p className="mt-4 font-semibold">{song.title}</p>
                <p className="text-sm text-zinc-500">{song.artist} · {song.sections} sections</p>
              </button>
            ))}
          </div>
        </MagneticCard>
        <MagneticCard className="p-5">
          <h2 className="font-display text-2xl font-bold">Activity</h2>
          <div className="mt-6 space-y-5">
            {activity.map((item) => (
              <div key={item} className="flex gap-3">
                <span className="mt-1 grid h-7 w-7 place-items-center rounded-full bg-mint/15">
                  <Sparkles className="h-3.5 w-3.5 text-mint" />
                </span>
                <p className="text-sm leading-6 text-zinc-300">{item}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-white/8 bg-white/[0.04] p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium">
              <HardDrive className="h-4 w-4 text-azure" /> Storage usage
            </div>
            <div className="h-2 rounded-full bg-white/10">
              <div className="h-2 w-[68%] rounded-full bg-gradient-to-r from-violet to-mint" />
            </div>
            <p className="mt-2 text-xs text-zinc-500">1.8 TB of 2.6 TB used</p>
          </div>
        </MagneticCard>
      </div>
    </Page>
  );
}

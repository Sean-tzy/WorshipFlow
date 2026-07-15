import {
  Copy,
  Edit3,
  Heart,
  Play,
  Plus,
  Trash2,
  CalendarDays,
  Clock3,
  Music2,
  MapPinned,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/button";
import { MagneticCard, Page } from "../components/motion";
import {
  PlannerService,
  SongPresentation,
  createPlannerService,
  createPlannerItem,
  deletePlannerService,
  duplicatePlannerService,
  savePlannerService,
  upsertSongPresentation,
  useWorshipflowStore,
} from "../lib/worshipflow-store";

function displayDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function formatDuration(seconds: number) {
  const total = Math.max(0, seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

export function HistoryPage() {
  const store = useWorshipflowStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<"services" | "songs">("services");

  const selectedRecord = useMemo(() => {
    const recordId = searchParams.get("record");
    return store.historyRecords.find((record) => record.id === recordId) ?? store.historyRecords[0] ?? null;
  }, [searchParams, store.historyRecords]);

  const selectedService = selectedRecord
    ? store.plannerServices.find((service) => service.id === selectedRecord.plannerServiceId) ?? null
    : null;

  const selectRecord = (recordId: string) => {
    setSearchParams({ record: recordId });
  };

  const presentAgain = (service: PlannerService | null) => {
    if (!service) return;
    navigate(`/app/planner?service=${service.id}&present=1`);
  };

  const editPlanner = (service: PlannerService | null) => {
    if (!service) return;
    navigate(`/app/planner?service=${service.id}`);
  };

  const duplicatePlanner = (service: PlannerService | null) => {
    if (!service) return;
    const clone = duplicatePlannerService(service.id);
    if (clone) {
      navigate(`/app/planner?service=${clone.id}`);
      toast.success("Planner duplicated");
    }
  };

  const removePlanner = (service: PlannerService | null) => {
    if (!service) return;
    deletePlannerService(service.id);
    toast.success("Planner deleted");
    if (store.historyRecords.length > 1) {
      setSearchParams({ record: store.historyRecords.find((record) => record.plannerServiceId !== service.id)?.id ?? "" });
    }
  };

  const toggleFavorite = (song: SongPresentation) => {
    upsertSongPresentation({ ...song, favorite: !song.favorite });
    toast.success(song.favorite ? "Removed from favorites" : "Added to favorites");
  };

  const addSongToPlanner = (song: SongPresentation) => {
    const service = createPlannerService({ title: `${song.title} Service` });
    service.items = [
      createPlannerItem(service.id, "timer"),
      createPlannerItem(service.id, "welcome"),
      createPlannerItem(service.id, "song", {
        title: song.title,
        songPresentationId: song.id,
        durationSeconds: song.slides.length * 8,
        settings: { song: { songPresentationId: song.id } },
      }),
    ];
    savePlannerService(service);
    navigate(`/app/planner?service=${service.id}`);
    toast.success("Song added to a new planner");
  };

  return (
    <Page className="px-4 py-6 md:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-mint">History</p>
          <h2 className="font-display text-4xl font-black tracking-[-0.02em]">Service history and saved songs</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant={tab === "services" ? "primary" : "secondary"} onClick={() => setTab("services")}>
            <CalendarDays className="h-4 w-4" /> Services
          </Button>
          <Button variant={tab === "songs" ? "primary" : "secondary"} onClick={() => setTab("songs")}>
            <Music2 className="h-4 w-4" /> Songs
          </Button>
        </div>
      </div>

      {tab === "services" ? (
        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <MagneticCard className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-display text-2xl font-bold">Service records</h3>
                <p className="text-sm text-zinc-500">Snapshots are grouped by service date.</p>
              </div>
              <div className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-zinc-400">
                {store.historyRecords.length} records
              </div>
            </div>
            <div className="space-y-3">
              {store.historyRecords.map((record) => (
                <button
                  key={record.id}
                  onClick={() => selectRecord(record.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${selectedRecord?.id === record.id ? "border-mint/50 bg-mint/10" : "border-white/8 bg-white/[0.04] hover:bg-white/[0.08]"}`}
                >
                  <p className="font-semibold">{record.plannerTitle}</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {displayDate(record.serviceDate)} - {record.createdBy}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.22em] text-zinc-500">{record.status}</p>
                </button>
              ))}
              {!store.historyRecords.length && (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/15 p-5 text-sm text-zinc-500">
                  Present a service from Planner to create a dated snapshot here.
                </div>
              )}
            </div>
          </MagneticCard>

          <MagneticCard className="p-5">
            {selectedRecord ? (
              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-mint">Service history</p>
                    <h3 className="font-display text-3xl font-bold">{selectedRecord.plannerTitle}</h3>
                    <p className="mt-1 text-sm text-zinc-500">
                      {displayDate(selectedRecord.serviceDate)} - created {displayDate(selectedRecord.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={() => presentAgain(selectedService)}>
                      <Play className="h-4 w-4" /> Present again
                    </Button>
                    <Button variant="secondary" onClick={() => duplicatePlanner(selectedService)}>
                      <Copy className="h-4 w-4" /> Duplicate
                    </Button>
                    <Button variant="secondary" onClick={() => editPlanner(selectedService)}>
                      <Edit3 className="h-4 w-4" /> Edit
                    </Button>
                    <Button variant="secondary" onClick={() => removePlanner(selectedService)}>
                      <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-4">
                  <StatCard label="Created by" value={selectedRecord.createdBy} icon={Users} />
                  <StatCard label="Sequence items" value={String(selectedRecord.sequenceSnapshot.length)} icon={Clock3} />
                  <StatCard label="Presented at" value={displayDate(selectedRecord.presentedAt)} icon={MapPinned} />
                  <StatCard label="Status" value={selectedRecord.status} icon={CalendarDays} />
                </div>

                <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                  <h4 className="font-display text-xl font-bold">Full sequence</h4>
                  <div className="mt-4 space-y-2">
                    {selectedRecord.sequenceSnapshot.map((item, index) => (
                      <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/15 p-3">
                        <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/[0.06] text-xs text-zinc-400">{index + 1}</span>
                        <span className="flex-1 font-medium">{item.title}</span>
                        <span className="text-sm text-zinc-500">{item.type}</span>
                        <span className="text-sm text-zinc-500">{item.durationSeconds ? formatDuration(item.durationSeconds) : "Live"}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                    <h4 className="font-display text-xl font-bold">Timer and welcome</h4>
                    <div className="mt-3 space-y-2">
                      {selectedRecord.sequenceSnapshot.filter((item) => item.type === "timer" || item.type === "welcome").map((item) => (
                        <div key={item.id} className="rounded-2xl border border-white/8 bg-black/15 p-3">
                          <p className="font-semibold">{item.title}</p>
                          <p className="text-sm text-zinc-500">{item.type === "timer" ? formatDuration(item.durationSeconds) : "Welcome preview saved"}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                    <h4 className="font-display text-xl font-bold">Songs used</h4>
                    <div className="mt-3 space-y-2">
                      {selectedRecord.sequenceSnapshot.filter((item) => item.songPresentationId).map((item) => {
                        const song = store.songPresentations.find((entry) => entry.id === item.songPresentationId);
                        return (
                          <div key={item.id} className="rounded-2xl border border-white/8 bg-black/15 p-3">
                            <p className="font-semibold">{song?.title ?? item.title}</p>
                            <p className="text-sm text-zinc-500">{song?.artist ?? "Saved in builder"}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/15 p-5 text-sm text-zinc-500">
                Select a history record to inspect the full service snapshot.
              </div>
            )}
          </MagneticCard>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <MagneticCard className="p-5">
            <h3 className="font-display text-2xl font-bold">Songs from Builder</h3>
            <p className="mt-1 text-sm text-zinc-500">These presentations can be added to future planners.</p>
            <div className="mt-4 space-y-3">
              {store.songPresentations.map((song) => (
                <div key={song.id} className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">{song.title}</p>
                      <p className="text-sm text-zinc-500">{song.artist}</p>
                    </div>
                    <button
                      onClick={() => toggleFavorite(song)}
                      className={`rounded-full border p-2 ${song.favorite ? "border-amber-300/40 bg-amber-300/10 text-amber-300" : "border-white/10 text-zinc-500 hover:bg-white/[0.08]"}`}
                    >
                      <Heart className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-zinc-500">
                    <div>Created {displayDate(song.createdAt)}</div>
                    <div>Last used {song.lastUsedAt ? displayDate(song.lastUsedAt) : "Never"}</div>
                    <div>Used {song.usageCount} times</div>
                    <div>{song.slides.length} slides</div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button variant="secondary" className="h-10 px-4" onClick={() => navigate("/app/builder")}>
                      <Edit3 className="h-4 w-4" /> Edit
                    </Button>
                    <Button variant="secondary" className="h-10 px-4" onClick={() => addSongToPlanner(song)}>
                      <Plus className="h-4 w-4" /> Add to planner
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </MagneticCard>

          <MagneticCard className="p-5">
            <h3 className="font-display text-2xl font-bold">Song usage timeline</h3>
            <p className="mt-1 text-sm text-zinc-500">Helpful when checking which songs were used in recent services.</p>
            <div className="mt-4 space-y-3">
              {store.historyRecords.map((record) => (
                <button
                  key={record.id}
                  onClick={() => {
                    setTab("services");
                    setSearchParams({ record: record.id });
                  }}
                  className="w-full rounded-2xl border border-white/8 bg-white/[0.04] p-4 text-left transition hover:bg-white/[0.08]"
                >
                  <p className="font-semibold">{record.plannerTitle}</p>
                  <p className="text-sm text-zinc-500">{displayDate(record.serviceDate)} - {record.sequenceSnapshot.filter((item) => item.songPresentationId).length} songs</p>
                </button>
              ))}
            </div>
          </MagneticCard>
        </div>
      )}
    </Page>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string; icon: typeof CalendarDays }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
      <div className="flex items-center justify-between">
        <Icon className="h-4 w-4 text-mint" />
        <span className="text-xs text-zinc-500">{label}</span>
      </div>
      <p className="mt-4 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

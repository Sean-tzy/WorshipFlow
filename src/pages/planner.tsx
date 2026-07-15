import { AnimatePresence, Reorder, motion } from "framer-motion";
import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  DollarSign,
  HandHeart,
  Image,
  Megaphone,
  Mic2,
  Music2,
  Pause,
  Play,
  Plus,
  Save,
  SkipForward,
  SunMedium,
  TimerReset,
  Trash2,
  X,
  Wine,
  FileText,
} from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/button";
import { MagneticCard, Page } from "../components/motion";
import {
  BackgroundAsset,
  PlannerItem,
  PlannerItemType,
  PlannerService,
  SongPresentation,
  backgroundLibraryOptions,
  createBackgroundAsset,
  createDefaultTimerSettings,
  createDefaultWelcomeSettings,
  createPlannerItem,
  createPlannerService,
  deletePlannerService,
  duplicatePlannerService,
  getSongPresentationById,
  markSongUsed,
  saveHistoryFromPlanner,
  savePlannerService,
  updatePlannerService,
  useWorshipflowStore,
  upsertPlannerServiceItem,
} from "../lib/worshipflow-store";

const itemTypes: Array<{ type: PlannerItemType; label: string; icon: typeof Clock3 }> = [
  { type: "timer", label: "Timer", icon: Clock3 },
  { type: "welcome", label: "Welcome", icon: SunMedium },
  { type: "song", label: "Song", icon: Music2 },
  { type: "bible", label: "Bible Reading", icon: BookOpen },
  { type: "announcement", label: "Announcement", icon: Megaphone },
  { type: "video", label: "Video", icon: Play },
  { type: "prayer", label: "Prayer", icon: HandHeart },
  { type: "offering", label: "Offering", icon: DollarSign },
  { type: "communion", label: "Communion", icon: Wine },
  { type: "custom", label: "Custom Item", icon: FileText },
];

const extraBackgrounds = [
  createBackgroundAsset({ name: "Sanctuary Glow", kind: "gradient", value: "from-violet-950 via-sky-700 to-emerald-500", label: "Gradient" }),
  createBackgroundAsset({ name: "Deep Ink", kind: "solid", value: "#09090B", label: "Solid" }),
  createBackgroundAsset({ name: "Moonlight", kind: "image", value: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1600&q=80", label: "Image" }),
];

function backgroundOptions() {
  return [...backgroundLibraryOptions(), ...extraBackgrounds];
}

function formatDuration(seconds: number) {
  const total = Math.max(0, seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

function displayDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function PlannerPage() {
  const store = useWorshipflowStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [serviceId, setServiceId] = useState<string>("");
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [showAddItem, setShowAddItem] = useState(false);
  const [selectedType, setSelectedType] = useState<PlannerItemType>("song");
  const [presenting, setPresenting] = useState(false);
  const [autoPresent, setAutoPresent] = useState(false);

  const service = useMemo<PlannerService>(() => {
    const requested = searchParams.get("service");
    const existing = requested ? store.plannerServices.find((item) => item.id === requested) : undefined;
    const current = existing ?? store.plannerServices.find((item) => item.id === serviceId) ?? store.plannerServices[0];

    if (current) return current;

    const created = createPlannerService();
    savePlannerService(created);
    setServiceId(created.id);
    return created;
  }, [searchParams, serviceId, store.plannerServices]);

  useEffect(() => {
    if (service && service.id !== serviceId) {
      setServiceId(service.id);
      setSelectedItemId(service.items[0]?.id ?? "");
    }
  }, [service, serviceId]);

  useEffect(() => {
    if (!selectedItemId) {
      setSelectedItemId(service.items[0]?.id ?? "");
    }
  }, [service.items, selectedItemId]);

  useEffect(() => {
    const present = searchParams.get("present");
    if (present === "1" && service.items.length && !presenting && !autoPresent) {
      setAutoPresent(true);
      setPresenting(true);
      startPresentation(service);
      setSearchParams((params) => {
        params.delete("present");
        return params;
      }, { replace: true });
    }
  }, [autoPresent, presenting, searchParams, service, setSearchParams]);

  const selectedItem = service.items.find((item) => item.id === selectedItemId) ?? service.items[0] ?? null;

  const persistItems = (items: PlannerItem[]) => {
    const next = { ...service, items: items.map((item, index) => ({ ...item, order: index })) };
    savePlannerService(next);
    setServiceId(next.id);
  };

  const updateServiceField = (patch: Partial<PlannerService>) => {
    updatePlannerService(service.id, patch);
  };

  const addItem = (item: PlannerItem) => {
    const next = [...service.items, { ...item, plannerServiceId: service.id, order: service.items.length }];
    savePlannerService({ ...service, items: next });
    setSelectedItemId(item.id);
    toast.success(`${item.title} added`);
  };

  const handleDeleteItem = (itemId: string) => {
    const next = service.items.filter((item) => item.id !== itemId);
    savePlannerService({ ...service, items: next });
    setSelectedItemId(next[0]?.id ?? "");
  };

  const handleSaveOrder = () => {
    savePlannerService(service);
    toast.success("Service order saved");
  };

  const handlePresent = () => {
    setPresenting(true);
    startPresentation(service);
  };

  const handleDuplicatePlanner = () => {
    const clone = duplicatePlannerService(service.id);
    if (clone) {
      setSearchParams({ service: clone.id });
      toast.success("Planner duplicated");
    }
  };

  const handleDeletePlanner = () => {
    deletePlannerService(service.id);
    const next = store.plannerServices.find((item) => item.id !== service.id);
    if (next) {
      setSearchParams({ service: next.id });
    } else {
      const created = createPlannerService();
      savePlannerService(created);
      setSearchParams({ service: created.id });
    }
    toast.success("Planner deleted");
  };

  const activeServiceDate = service.serviceDate;

  return (
    <Page className="px-4 py-6 md:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-mint">Sunday Planner</p>
          <h2 className="font-display text-4xl font-black tracking-[-0.02em]">{service.title}</h2>
          <p className="mt-1 text-sm text-zinc-500">{displayDate(activeServiceDate)} - {service.createdBy}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setShowAddItem(true)}>
            <Plus className="h-4 w-4" /> Add item
          </Button>
          <Button variant="secondary" onClick={handleSaveOrder}>
            <Save className="h-4 w-4" /> Save order
          </Button>
          <Button variant="secondary" onClick={handleDuplicatePlanner}>
            <Copy className="h-4 w-4" /> Duplicate
          </Button>
          <Button onClick={handlePresent}>
            <Play className="h-4 w-4" /> Present Service
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <MagneticCard className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-2xl font-bold">Service sequence</h3>
                <p className="text-sm text-zinc-500">Drag items to reorder the live run of service.</p>
              </div>
              <div className="flex items-center gap-2">
                <label className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-zinc-400">
                  Service title
                  <input
                    value={service.title}
                    onChange={(event) => updateServiceField({ title: event.target.value })}
                    className="ml-3 bg-transparent outline-none"
                  />
                </label>
                <label className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-zinc-400">
                  Date
                  <input
                    type="date"
                    value={service.serviceDate}
                    onChange={(event) => updateServiceField({ serviceDate: event.target.value })}
                    className="ml-3 bg-transparent outline-none"
                  />
                </label>
              </div>
            </div>

            <Reorder.Group axis="y" values={service.items} onReorder={persistItems} className="mt-5 space-y-3">
              {service.items.map((item, index) => (
                <Reorder.Item
                  key={item.id}
                  value={item}
                  className={`rounded-2xl border p-4 transition ${selectedItemId === item.id ? "border-mint/50 bg-mint/10" : "border-white/8 bg-white/[0.04] hover:bg-white/[0.08]"}`}
                  onClick={() => setSelectedItemId(item.id)}
                >
                  <ServiceRow
                    item={item}
                    index={index}
                    onDelete={() => handleDeleteItem(item.id)}
                    onEdit={() => setSelectedItemId(item.id)}
                  />
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </MagneticCard>

          <MagneticCard className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-display text-2xl font-bold">Planner history</h3>
                <p className="text-sm text-zinc-500">Saved service records appear here after presentation.</p>
              </div>
              <Button variant="secondary" onClick={() => navigate("/app/history")}>
                <Clock3 className="h-4 w-4" /> Open History
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {store.historyRecords.slice(0, 4).map((record) => (
                <button
                  key={record.id}
                  onClick={() => navigate(`/app/history?record=${record.id}`)}
                  className="rounded-2xl border border-white/8 bg-white/[0.04] p-4 text-left transition hover:bg-white/[0.08]"
                >
                  <p className="font-semibold">{record.plannerTitle}</p>
                  <p className="mt-1 text-sm text-zinc-500">{displayDate(record.serviceDate)}</p>
                </button>
              ))}
              {!store.historyRecords.length && (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/15 p-4 text-sm text-zinc-500">
                  Present a service and its snapshot will appear here.
                </div>
              )}
            </div>
          </MagneticCard>
        </div>

        <div className="space-y-4">
          <MagneticCard className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-display text-2xl font-bold">Selected item</h3>
                <p className="text-sm text-zinc-500">Edit the active item without leaving the planner.</p>
              </div>
              <div className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-zinc-400">
                {selectedItem?.type ?? "none"}
              </div>
            </div>

            {selectedItem ? (
              <SelectedItemEditor
                service={service}
                item={selectedItem}
                songs={store.songPresentations}
                onUpdate={(patch) => {
                  const next = service.items.map((entry) => (entry.id === selectedItem.id ? { ...entry, ...patch } : entry));
                  savePlannerService({ ...service, items: next });
                }}
                onReplace={(updated) => upsertPlannerServiceItem(service.id, { ...updated, plannerServiceId: service.id })}
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/15 p-5 text-sm text-zinc-500">
                Select a service item to edit it here.
              </div>
            )}
          </MagneticCard>

          <MagneticCard className="p-5">
            <h3 className="font-display text-2xl font-bold">Service tools</h3>
            <div className="mt-4 grid gap-3">
              {itemTypes.map((itemType) => (
                <button
                  key={itemType.type}
                  onClick={() => {
                    setSelectedType(itemType.type);
                    setShowAddItem(true);
                  }}
                  className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.04] p-3 text-left transition hover:bg-white/[0.08]"
                >
                  <itemType.icon className="h-4 w-4 text-mint" />
                  <span className="flex-1 text-sm font-medium">{itemType.label}</span>
                  <ChevronRight className="h-4 w-4 text-zinc-500" />
                </button>
              ))}
            </div>
          </MagneticCard>

          <MagneticCard className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-xl font-bold">Planner actions</h3>
              <Button variant="secondary" onClick={handleDeletePlanner}>
                <Trash2 className="h-4 w-4" /> Delete planner
              </Button>
            </div>
            <p className="text-sm leading-6 text-zinc-500">
              Changes are persisted locally, so refresh and navigation do not clear the service plan.
            </p>
          </MagneticCard>
        </div>
      </div>

      <AnimatePresence>
        {showAddItem && (
          <AddItemModal
            type={selectedType}
            songs={store.songPresentations}
            onClose={() => setShowAddItem(false)}
            onSelectType={setSelectedType}
            onAdd={(item) => {
              addItem(item);
              setShowAddItem(false);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {presenting && <ServicePresentation service={service} onClose={() => setPresenting(false)} />}
      </AnimatePresence>
    </Page>
  );
}

function ServiceRow({
  item,
  index,
  onDelete,
  onEdit,
}: {
  item: PlannerItem;
  index: number;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const iconMap: Record<PlannerItemType, typeof Clock3> = {
    timer: Clock3,
    welcome: SunMedium,
    song: Music2,
    bible: BookOpen,
    announcement: Megaphone,
    video: Play,
    prayer: HandHeart,
    offering: Wine,
    communion: Wine,
    custom: FileText,
  };

  const Icon = iconMap[item.type];

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/[0.06]">
        <Icon className="h-4 w-4 text-mint" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{item.title}</p>
        <p className="text-sm text-zinc-500">
          {index + 1}. {item.type} {item.songPresentationId ? `- song #${item.songPresentationId.slice(-4)}` : ""} {item.durationSeconds ? `- ${formatDuration(item.durationSeconds)}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onEdit} className="rounded-full border border-white/10 p-2 text-zinc-400 hover:bg-white/[0.08] hover:text-white">
          <ChevronDown className="h-4 w-4" />
        </button>
        <button onClick={onDelete} className="rounded-full border border-white/10 p-2 text-zinc-400 hover:bg-white/[0.08] hover:text-white">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function SelectedItemEditor({
  service,
  item,
  songs,
  onUpdate,
  onReplace,
}: {
  service: PlannerService;
  item: PlannerItem;
  songs: SongPresentation[];
  onUpdate: (patch: Partial<PlannerItem>) => void;
  onReplace: (item: PlannerItem) => void;
}) {
  if (item.type === "timer") {
    const timer = (item.settings.timer as ReturnType<typeof createDefaultTimerSettings>) ?? createDefaultTimerSettings();
    return (
      <div className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm text-zinc-400">Timer title</span>
          <input
            value={timer.title}
            onChange={(event) => onUpdate({ settings: { ...item.settings, timer: { ...timer, title: event.target.value } }, title: event.target.value })}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 outline-none"
          />
        </label>
        <div className="grid grid-cols-3 gap-3">
          {(["hours", "minutes", "seconds"] as const).map((key) => (
            <label key={key} className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-zinc-500">{key}</span>
              <input
                type="number"
                min={0}
                value={timer[key]}
                onChange={(event) => {
                  const nextTimer = { ...timer, [key]: Number(event.target.value) };
                  onUpdate({ durationSeconds: nextTimer.hours * 3600 + nextTimer.minutes * 60 + nextTimer.seconds, settings: { ...item.settings, timer: nextTimer } });
                }}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 outline-none"
              />
            </label>
          ))}
        </div>
        <BackgroundPicker
          background={timer.background}
          onChange={(background) => onUpdate({ background, settings: { ...item.settings, timer: { ...timer, background } } })}
        />
      </div>
    );
  }

  if (item.type === "welcome") {
    const welcome = (item.settings.welcome as ReturnType<typeof createDefaultWelcomeSettings>) ?? createDefaultWelcomeSettings();
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm text-zinc-400">Main heading</span>
            <input value={welcome.heading} onChange={(event) => onUpdate({ title: event.target.value, settings: { ...item.settings, welcome: { ...welcome, heading: event.target.value } } })} className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 outline-none" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-zinc-400">Subtitle</span>
            <input value={welcome.subtitle} onChange={(event) => onUpdate({ settings: { ...item.settings, welcome: { ...welcome, subtitle: event.target.value } } })} className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 outline-none" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-zinc-400">Church name</span>
            <input value={welcome.churchName} onChange={(event) => onUpdate({ settings: { ...item.settings, welcome: { ...welcome, churchName: event.target.value } } })} className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 outline-none" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-zinc-400">Service date</span>
            <input type="date" value={welcome.serviceDate} onChange={(event) => onUpdate({ settings: { ...item.settings, welcome: { ...welcome, serviceDate: event.target.value } } })} className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 outline-none" />
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <SliderInput label="Font size" value={welcome.fontSize} min={36} max={96} onChange={(value) => onUpdate({ settings: { ...item.settings, welcome: { ...welcome, fontSize: value } } })} />
          <SliderInput label="Font weight" value={welcome.weight} min={500} max={900} step={100} onChange={(value) => onUpdate({ settings: { ...item.settings, welcome: { ...welcome, weight: value } } })} />
          <SliderInput label="Overlay" value={welcome.overlay} min={0} max={80} onChange={(value) => onUpdate({ settings: { ...item.settings, welcome: { ...welcome, overlay: value } } })} />
          <label className="block">
            <span className="mb-2 block text-sm text-zinc-400">Text color</span>
            <input type="color" value={welcome.color} onChange={(event) => onUpdate({ settings: { ...item.settings, welcome: { ...welcome, color: event.target.value } } })} className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.05] p-2" />
          </label>
        </div>
        <label className="block">
          <span className="mb-2 block text-sm text-zinc-400">Alignment</span>
          <select value={welcome.alignment} onChange={(event) => onUpdate({ settings: { ...item.settings, welcome: { ...welcome, alignment: event.target.value as "left" | "center" | "right" } } })} className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 outline-none">
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </label>
        <BackgroundPicker background={welcome.background} onChange={(background) => onUpdate({ background, settings: { ...item.settings, welcome: { ...welcome, background } } })} />
        <WelcomePreview welcome={welcome} />
      </div>
    );
  }

  if (item.type === "song") {
    const linkedSong = item.songPresentationId ? songs.find((song) => song.id === item.songPresentationId) ?? getSongPresentationById(item.songPresentationId) : null;
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
          <p className="text-sm text-zinc-400">Linked song</p>
          <p className="mt-1 font-semibold">{linkedSong?.title ?? "Choose a saved song"}</p>
          <p className="text-sm text-zinc-500">{linkedSong?.artist ?? "Saved Builder songs appear here"}</p>
        </div>
        <div className="grid gap-3">
          {songs.map((song) => (
            <button
              key={song.id}
              onClick={() => onReplace({ ...item, title: song.title, songPresentationId: song.id, durationSeconds: song.slides.length * 8, background: null, settings: { ...item.settings, song: { songPresentationId: song.id } } })}
              className={`rounded-2xl border p-4 text-left transition ${song.id === item.songPresentationId ? "border-mint/50 bg-mint/10" : "border-white/8 bg-white/[0.04] hover:bg-white/[0.08]"}`}
            >
              <p className="font-semibold">{song.title}</p>
              <p className="text-sm text-zinc-500">
                {song.artist} - {song.slides.length} slides - used {song.usageCount} times
              </p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="mb-2 block text-sm text-zinc-400">Title</span>
        <input value={item.title} onChange={(event) => onUpdate({ title: event.target.value })} className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 outline-none" />
      </label>
      <BackgroundPicker background={item.background} onChange={(background) => onUpdate({ background })} />
      <label className="block">
        <span className="mb-2 block text-sm text-zinc-400">Duration</span>
        <input value={formatDuration(item.durationSeconds || 0)} readOnly className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 outline-none" />
      </label>
    </div>
  );
}

function SliderInput({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex justify-between text-sm text-zinc-400">
        <span>{label}</span>
        <span>{value}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} className="w-full accent-mint" onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function BackgroundPicker({ background, onChange }: { background: BackgroundAsset | null; onChange: (background: BackgroundAsset) => void }) {
  const options = backgroundOptions();
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="mb-2 block text-sm text-zinc-400">Background</span>
        <select value={background?.id ?? ""} onChange={(event) => onChange(options.find((option) => option.id === event.target.value) ?? extraBackgrounds[0])} className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 outline-none">
          <option value="">Select a background</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label} - {option.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block rounded-2xl border border-dashed border-white/10 bg-black/20 p-3 text-sm text-zinc-500">
        <span className="mb-2 block">Upload image</span>
        <input
          type="file"
          accept="image/*"
          className="w-full text-xs"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            onChange(createBackgroundAsset({ name: file.name, kind: "image", value: URL.createObjectURL(file), label: "Image" }));
          }}
        />
      </label>
    </div>
  );
}

function WelcomePreview({ welcome }: { welcome: ReturnType<typeof createDefaultWelcomeSettings> }) {
  return (
    <div
      className={`relative min-h-80 overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-br ${welcome.background.kind === "gradient" ? welcome.background.value : "from-violet-950 via-sky-700 to-emerald-500"} p-6 text-center`}
      style={welcome.background.kind === "solid" ? { backgroundColor: welcome.background.value } : undefined}
    >
      {(welcome.background.kind === "video" || welcome.background.kind === "library") && <video className="absolute inset-0 h-full w-full object-cover" src={welcome.background.value} autoPlay muted loop playsInline />}
      {welcome.background.kind === "image" && <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${welcome.background.value})` }} />}
      <div className="absolute inset-0 bg-black" style={{ opacity: welcome.overlay / 100 }} />
      <div className="relative flex min-h-72 flex-col items-center justify-center">
        <p className="text-sm uppercase tracking-[0.3em] text-white/60">{displayDate(welcome.serviceDate)}</p>
        <h4 className="mt-4 font-display text-4xl font-black leading-tight text-white">{welcome.heading}</h4>
        <p className="mt-4 text-base text-white/80">{welcome.subtitle}</p>
        <p className="mt-6 text-sm uppercase tracking-[0.32em] text-white/60">{welcome.churchName}</p>
      </div>
    </div>
  );
}

function AddItemModal({
  type,
  songs,
  onClose,
  onSelectType,
  onAdd,
}: {
  type: PlannerItemType;
  songs: SongPresentation[];
  onClose: () => void;
  onSelectType: (type: PlannerItemType) => void;
  onAdd: (item: PlannerItem) => void;
}) {
  const [timer, setTimer] = useState(createDefaultTimerSettings());
  const [welcome, setWelcome] = useState(createDefaultWelcomeSettings());
  const [genericTitle, setGenericTitle] = useState("Custom Item");
  const [selectedSongId, setSelectedSongId] = useState(songs[0]?.id ?? "");
  const backgrounds = backgroundOptions();

  useEffect(() => {
    if (!selectedSongId && songs[0]?.id) setSelectedSongId(songs[0].id);
  }, [selectedSongId, songs]);

  const addCurrent = () => {
    if (type === "timer") {
      onAdd(createPlannerItem("", "timer", { title: timer.title, durationSeconds: timer.hours * 3600 + timer.minutes * 60 + timer.seconds, background: timer.background, settings: { timer } }));
      return;
    }
    if (type === "welcome") {
      onAdd(createPlannerItem("", "welcome", { title: welcome.heading, background: welcome.background, settings: { welcome }, durationSeconds: 20 }));
      return;
    }
    if (type === "song") {
      const song = songs.find((item) => item.id === selectedSongId) ?? songs[0];
      if (!song) {
        toast.error("Create or save a song first");
        return;
      }
      onAdd(createPlannerItem("", "song", { title: song.title, songPresentationId: song.id, durationSeconds: song.slides.length * 8, settings: { song: { songPresentationId: song.id } } }));
      return;
    }
    onAdd(createPlannerItem("", type, { title: genericTitle, background: extraBackgrounds[0], settings: { title: genericTitle } }));
  };

  return (
    <motion.div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/65 p-3 md:items-center md:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div initial={{ y: 28, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 18, opacity: 0, scale: 0.98 }} transition={{ duration: 0.22 }} className="w-full max-w-6xl overflow-hidden rounded-[28px] border border-white/10 bg-ink shadow-soft">
        <div className="grid min-h-[78vh] lg:grid-cols-[280px_1fr]">
          <div className="border-b border-white/8 bg-white/[0.04] p-4 lg:border-b-0 lg:border-r">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-2xl font-bold">Add item</h3>
              <button onClick={onClose} className="rounded-full border border-white/10 p-2 text-zinc-400 hover:bg-white/[0.08] hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2">
              {itemTypes.map((entry) => (
                <button
                  key={entry.type}
                  onClick={() => onSelectType(entry.type)}
                  className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${type === entry.type ? "border-mint/50 bg-mint/10 text-white" : "border-white/8 bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08]"}`}
                >
                  <entry.icon className="h-4 w-4 text-mint" />
                  <span>{entry.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 p-4 md:grid-cols-[1fr_380px]">
            <div className="space-y-4">
              <div className="rounded-[24px] border border-white/8 bg-white/[0.04] p-5">
                {type === "song" && (
                  <div className="space-y-3">
                    <h4 className="font-display text-xl font-bold">Saved songs</h4>
                    {songs.length ? songs.map((song) => (
                      <button
                        key={song.id}
                        onClick={() => setSelectedSongId(song.id)}
                        className={`w-full rounded-2xl border p-4 text-left transition ${selectedSongId === song.id ? "border-mint/50 bg-mint/10" : "border-white/8 bg-white/[0.04] hover:bg-white/[0.08]"}`}
                      >
                        <p className="font-semibold">{song.title}</p>
                        <p className="text-sm text-zinc-500">{song.artist} - {song.slides.length} slides</p>
                      </button>
                    )) : (
                      <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-zinc-500">
                        Save a song in Builder first.
                      </div>
                    )}
                  </div>
                )}

                {type === "timer" && (
                  <div className="space-y-4">
                    <h4 className="font-display text-xl font-bold">Timer settings</h4>
                    <label className="block">
                      <span className="mb-2 block text-sm text-zinc-400">Timer title</span>
                      <input value={timer.title} onChange={(event) => setTimer({ ...timer, title: event.target.value })} className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 outline-none" />
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {(["hours", "minutes", "seconds"] as const).map((key) => (
                        <label key={key}>
                          <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-zinc-500">{key}</span>
                          <input type="number" min={0} value={timer[key]} onChange={(event) => setTimer({ ...timer, [key]: Number(event.target.value) })} className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 outline-none" />
                        </label>
                      ))}
                    </div>
                    <select value={timer.background.id} onChange={(event) => setTimer({ ...timer, background: backgrounds.find((item) => item.id === event.target.value) ?? timer.background })} className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 outline-none">
                      {backgrounds.map((background) => (
                        <option key={background.id} value={background.id}>{background.label} - {background.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {type === "welcome" && (
                  <div className="space-y-4">
                    <h4 className="font-display text-xl font-bold">Welcome customization</h4>
                    <label className="block">
                      <span className="mb-2 block text-sm text-zinc-400">Main heading</span>
                      <input value={welcome.heading} onChange={(event) => setWelcome({ ...welcome, heading: event.target.value })} className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 outline-none" />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm text-zinc-400">Subtitle</span>
                      <input value={welcome.subtitle} onChange={(event) => setWelcome({ ...welcome, subtitle: event.target.value })} className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 outline-none" />
                    </label>
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="block">
                        <span className="mb-2 block text-sm text-zinc-400">Church name</span>
                        <input value={welcome.churchName} onChange={(event) => setWelcome({ ...welcome, churchName: event.target.value })} className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 outline-none" />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-sm text-zinc-400">Service date</span>
                        <input type="date" value={welcome.serviceDate} onChange={(event) => setWelcome({ ...welcome, serviceDate: event.target.value })} className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 outline-none" />
                      </label>
                    </div>
                    <BackgroundPicker background={welcome.background} onChange={(background) => setWelcome({ ...welcome, background })} />
                    <label className="block">
                      <span className="mb-2 block text-sm text-zinc-400">Upload image</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="w-full rounded-2xl border border-white/10 bg-white/[0.05] p-3"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (!file) return;
                          setWelcome({ ...welcome, background: createBackgroundAsset({ name: file.name, kind: "image", value: URL.createObjectURL(file), label: "Image" }) });
                        }}
                      />
                    </label>
                  </div>
                )}

                {type !== "song" && type !== "timer" && type !== "welcome" && (
                  <div className="space-y-4">
                    <h4 className="font-display text-xl font-bold">Item details</h4>
                    <label className="block">
                      <span className="mb-2 block text-sm text-zinc-400">Title</span>
                      <input value={genericTitle} onChange={(event) => setGenericTitle(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 outline-none" />
                    </label>
                    <BackgroundPicker background={extraBackgrounds[0]} onChange={() => undefined} />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {type === "welcome" ? <WelcomePreview welcome={welcome} /> : <PreviewCard type={type} song={songs.find((item) => item.id === selectedSongId) ?? songs[0] ?? null} timer={timer} title={genericTitle} />}
              <Button className="w-full" onClick={addCurrent}>
                <Plus className="h-4 w-4" /> Add to service
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function PreviewCard({
  type,
  song,
  timer,
  title,
}: {
  type: PlannerItemType;
  song: SongPresentation | null;
  timer: ReturnType<typeof createDefaultTimerSettings>;
  title: string;
}) {
  if (type === "song" && song) {
    return (
      <MagneticCard className="overflow-hidden p-0">
        <div className="h-64 bg-gradient-to-br from-violet-950 via-sky-700 to-emerald-500 p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-white/60">Song</p>
          <h4 className="mt-3 font-display text-3xl font-bold">{song.title}</h4>
          <p className="mt-2 text-white/75">{song.artist}</p>
          <p className="mt-8 text-sm text-white/60">{song.slides.length} slides</p>
        </div>
      </MagneticCard>
    );
  }

  if (type === "timer") {
    return (
      <MagneticCard className="overflow-hidden p-0">
        <div className={`relative h-64 bg-gradient-to-br ${timer.background.kind === "gradient" ? timer.background.value : "from-violet-950 via-sky-700 to-emerald-500"}`}>
          {(timer.background.kind === "video" || timer.background.kind === "library") && <video className="absolute inset-0 h-full w-full object-cover" src={timer.background.value} autoPlay muted loop playsInline />}
          {timer.background.kind === "image" && <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${timer.background.value})` }} />}
          <div className="absolute inset-0 bg-black/35" />
          <div className="relative flex h-full flex-col justify-between p-6 text-white">
            <p className="text-sm uppercase tracking-[0.3em] text-white/60">{timer.title}</p>
            <div>
              <p className="font-display text-5xl font-black">{formatDuration(timer.hours * 3600 + timer.minutes * 60 + timer.seconds)}</p>
              <p className="mt-2 text-sm text-white/70">Countdown preview</p>
            </div>
          </div>
        </div>
      </MagneticCard>
    );
  }

  return (
    <MagneticCard className="overflow-hidden p-0">
      <div className="h-64 bg-gradient-to-br from-zinc-950 via-slate-700 to-cyan-400 p-6 text-white">
        <p className="text-sm uppercase tracking-[0.3em] text-white/60">{type}</p>
        <h4 className="mt-3 font-display text-3xl font-bold">{title}</h4>
        <p className="mt-2 text-white/75">Planner item preview</p>
      </div>
    </MagneticCard>
  );
}

type PresentationFrame = {
  id: string;
  item: PlannerItem;
  label: string;
  title: string;
  subtitle?: string;
  body?: string;
  background: BackgroundAsset | null;
  typography?: SongPresentation["typographySettings"];
  timer?: ReturnType<typeof createDefaultTimerSettings>;
  welcome?: ReturnType<typeof createDefaultWelcomeSettings>;
};

function ServicePresentation({ service, onClose }: { service: PlannerService; onClose: () => void }) {
  const frames = useMemo(() => buildPresentationFrames(service), [service]);
  const [index, setIndex] = useState(0);
  const [blackout, setBlackout] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);

  const activeFrame = frames[index] ?? frames[0];
  const resolvedBackground = activeFrame?.background;
  const timer = activeFrame?.timer ?? null;

  const nextItem = () => setIndex((value) => Math.min(value + 1, frames.length - 1));
  const previousItem = () => setIndex((value) => Math.max(value - 1, 0));

  useEffect(() => {
    document.documentElement.requestFullscreen?.().catch(() => undefined);
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        document.exitFullscreen?.().catch(() => undefined);
        onClose();
      }
      if (event.key === "ArrowRight" || event.key === " ") {
        nextItem();
      }
      if (event.key === "ArrowLeft") {
        previousItem();
      }
      if (event.key.toLowerCase() === "b") {
        setBlackout((value) => !value);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [frames.length, onClose]);

  useEffect(() => {
    if (timer) {
      const seconds = timer.hours * 3600 + timer.minutes * 60 + timer.seconds;
      setTimerRemaining(seconds);
      setTimerRunning(true);
    } else {
      setTimerRemaining(null);
      setTimerRunning(false);
    }
  }, [activeFrame?.id, timer]);

  useEffect(() => {
    if (!timerRunning || !timer) return;
    if (timerRemaining === null) return;
    if (timerRemaining <= 0) {
      setTimerRunning(false);
      nextItem();
      return;
    }
    const timeout = window.setTimeout(() => setTimerRemaining((value) => (value === null ? null : value - 1)), 1000);
    return () => window.clearTimeout(timeout);
  }, [timer, timerRemaining, timerRunning]);

  const overlay = activeFrame?.typography?.overlay ?? activeFrame?.welcome?.overlay ?? 45;
  const textAlign = activeFrame?.typography?.alignment ?? activeFrame?.welcome?.alignment ?? "center";
  const textColor = activeFrame?.typography?.color ?? activeFrame?.welcome?.color ?? "#ffffff";
  const fontWeight = activeFrame?.typography?.weight ?? activeFrame?.welcome?.weight ?? 800;
  const glow = activeFrame?.typography?.glow ?? 64;

  return createPortal(
    <motion.div className="fixed inset-0 z-[9999] h-[100dvh] w-[100dvw] overflow-hidden bg-black text-white" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div
        className={`absolute inset-0 bg-gradient-to-br ${blackout ? "from-black via-black to-black" : resolvedBackground?.kind === "gradient" ? resolvedBackground.value : "from-violet-950 via-sky-900 to-emerald-700"}`}
        style={!blackout && resolvedBackground?.kind === "solid" ? { backgroundColor: resolvedBackground.value } : undefined}
      />
      {!blackout && (resolvedBackground?.kind === "video" || resolvedBackground?.kind === "library") && (
        <video className="absolute inset-0 h-full w-full object-cover" src={resolvedBackground.value} autoPlay muted loop playsInline />
      )}
      {!blackout && resolvedBackground?.kind === "image" && <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${resolvedBackground.value})` }} />}
      <div className="absolute inset-0 bg-black" style={{ opacity: blackout ? 1 : overlay / 100 }} />

      <button
        onClick={() => {
          document.exitFullscreen?.().catch(() => undefined);
          onClose();
        }}
        className="absolute right-5 top-5 z-20 grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/30 text-white backdrop-blur-xl"
        aria-label="Exit presentation"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="absolute bottom-5 left-5 z-20 rounded-full border border-white/15 bg-black/30 px-4 py-2 text-sm text-white/70 backdrop-blur-xl">
        {index + 1} / {frames.length || 1} - ESC exits - arrows navigate - B blackout
      </div>

      <div className="absolute bottom-5 right-5 z-20 flex gap-2">
        <button onClick={previousItem} className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/30 backdrop-blur-xl">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button onClick={nextItem} className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/30 backdrop-blur-xl">
          <ChevronRight className="h-5 w-5" />
        </button>
        <button onClick={() => setBlackout((value) => !value)} className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/30 backdrop-blur-xl">
          <SunMedium className="h-5 w-5" />
        </button>
      </div>

      {timer && (
        <div className="absolute left-5 top-5 z-20 flex gap-2">
          <button onClick={() => setTimerRunning((value) => !value)} className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/30 backdrop-blur-xl">
            {timerRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>
          <button onClick={() => setTimerRemaining(timer.hours * 3600 + timer.minutes * 60 + timer.seconds)} className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/30 backdrop-blur-xl">
            <TimerReset className="h-5 w-5" />
          </button>
          <button onClick={nextItem} className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/30 backdrop-blur-xl">
            <SkipForward className="h-5 w-5" />
          </button>
        </div>
      )}

      {!blackout && (
        <div className="relative z-10 grid h-full place-items-center p-8 text-center">
          <motion.div
            key={activeFrame?.id ?? "empty"}
            initial={{ opacity: 0, y: 18, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.38 }}
            className="max-w-6xl"
            style={{ textAlign }}
          >
            <p className="mb-8 text-sm font-semibold uppercase tracking-[0.36em] text-white/60">{activeFrame?.label ?? "Planner"}</p>
            {timer ? (
              <p className="font-display text-7xl font-black md:text-[120px]">{formatDuration(timerRemaining ?? timer.hours * 3600 + timer.minutes * 60 + timer.seconds)}</p>
            ) : (
              <>
                <p
                  className="whitespace-pre-line font-display leading-tight"
                  style={{
                    color: textColor,
                    fontSize: activeFrame?.body ? `clamp(42px, ${Math.max((activeFrame.typography?.fontSize ?? 58) / 12, 5)}vw, 108px)` : "clamp(44px, 7vw, 112px)",
                    fontWeight,
                    textShadow: `0 0 ${Math.round(glow / 1.5)}px rgba(255,255,255,0.72)`,
                  }}
                >
                  {activeFrame?.body || activeFrame?.title || "Service item"}
                </p>
                {activeFrame?.subtitle && <p className="mt-5 text-xl text-white/80">{activeFrame.subtitle}</p>}
              </>
            )}
          </motion.div>
        </div>
      )}
    </motion.div>,
    document.body,
  );
}

function buildPresentationFrames(service: PlannerService): PresentationFrame[] {
  return service.items.flatMap<PresentationFrame>((item): PresentationFrame[] => {
    if (item.type === "song" && item.songPresentationId) {
      const song = getSongPresentationById(item.songPresentationId);
      if (song) {
        return song.slides.map((slide, slideIndex) => ({
          id: `${item.id}_${slide.id}`,
          item,
          label: slide.label,
          title: song.title,
          subtitle: `${song.artist} - ${slideIndex + 1}/${song.slides.length}`,
          body: slide.lyrics || "Prepared song presentation",
          background: slide.background ?? song.backgrounds[0] ?? item.background,
          typography: song.typographySettings,
        }));
      }
    }

    if (item.type === "timer") {
      const timer = (item.settings.timer as ReturnType<typeof createDefaultTimerSettings>) ?? createDefaultTimerSettings();
      return [{
        id: item.id,
        item,
        label: timer.title,
        title: timer.title,
        background: timer.background,
        timer,
      }];
    }

    if (item.type === "welcome") {
      const welcome = (item.settings.welcome as ReturnType<typeof createDefaultWelcomeSettings>) ?? createDefaultWelcomeSettings();
      return [{
        id: item.id,
        item,
        label: displayDate(welcome.serviceDate ?? service.serviceDate),
        title: welcome.heading || item.title,
        subtitle: welcome.subtitle,
        background: welcome.background,
        welcome,
      }];
    }

    return [{
      id: item.id,
      item,
      label: item.type,
      title: item.title,
      background: item.background,
    }];
  });
}

function startPresentation(service: PlannerService) {
  service.items.forEach((item) => {
    if (item.songPresentationId) {
      markSongUsed(item.songPresentationId);
    }
  });
  saveHistoryFromPlanner(service, "presented");
  toast.success("Service presentation started");
  const event = new CustomEvent("worshipflow-start-presentation", { detail: { serviceId: service.id } });
  window.dispatchEvent(event);
}

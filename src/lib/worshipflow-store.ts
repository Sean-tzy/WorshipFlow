import { useSyncExternalStore } from "react";
import { backgrounds as libraryBackgrounds, recentSongs } from "../data/workspace";

const STORAGE_KEY = "worshipflow.workspace.v1";
const STORE_EVENT = "worshipflow-store-change";
const EMPTY_RAW = "__empty__";

export type BackgroundKind = "video" | "image" | "gradient" | "solid" | "library";

export type BackgroundAsset = {
  id: string;
  name: string;
  kind: BackgroundKind;
  value: string;
  label: string;
  preview?: string;
};

export type TypographySettings = {
  fontSize: number;
  weight: number;
  color: string;
  alignment: "left" | "center" | "right";
  glow: number;
  overlay: number;
};

export type SongSlide = {
  id: string;
  label: string;
  lyrics: string;
  background: BackgroundAsset | null;
};

export type SongPresentation = {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  slides: SongSlide[];
  sections: string[];
  backgrounds: BackgroundAsset[];
  typographySettings: TypographySettings;
  transitions: string;
  createdAt: string;
  updatedAt: string;
  favorite: boolean;
  lastUsedAt: string | null;
  usageCount: number;
};

export type PlannerItemType =
  | "timer"
  | "welcome"
  | "song"
  | "bible"
  | "announcement"
  | "video"
  | "prayer"
  | "offering"
  | "communion"
  | "custom";

export type TimerSettings = {
  hours: number;
  minutes: number;
  seconds: number;
  title: string;
  background: BackgroundAsset;
};

export type WelcomeSettings = {
  heading: string;
  subtitle: string;
  churchName: string;
  serviceDate: string;
  fontSize: number;
  weight: number;
  color: string;
  alignment: "left" | "center" | "right";
  overlay: number;
  background: BackgroundAsset;
};

export type PlannerItem = {
  id: string;
  plannerServiceId: string;
  type: PlannerItemType;
  order: number;
  title: string;
  durationSeconds: number;
  background: BackgroundAsset | null;
  settings: Record<string, unknown>;
  songPresentationId: string | null;
};

export type PlannerService = {
  id: string;
  title: string;
  serviceDate: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  items: PlannerItem[];
};

export type HistoryRecord = {
  id: string;
  plannerServiceId: string;
  plannerTitle: string;
  serviceDate: string;
  createdBy: string;
  createdAt: string;
  presentedAt: string;
  status: "presented" | "completed" | "draft";
  sequenceSnapshot: PlannerItem[];
};

export type WorshipflowStore = {
  songPresentations: SongPresentation[];
  plannerServices: PlannerService[];
  historyRecords: HistoryRecord[];
};

const emptyStore: WorshipflowStore = {
  songPresentations: [],
  plannerServices: [],
  historyRecords: [],
};

let cachedRaw: string | null = null;
let cachedSnapshot: WorshipflowStore = emptyStore;

function isBrowser() {
  return typeof window !== "undefined";
}

function createId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function sanitizeNumber(value: unknown, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function defaultBackground(kind: BackgroundKind = "solid"): BackgroundAsset {
  return {
    id: createId(`bg_${kind}`),
    name: kind === "video" ? "Default Motion" : kind === "image" ? "Default Image" : "Default Background",
    kind,
    value: kind === "gradient" ? "from-violet-950 via-sky-700 to-emerald-500" : "#09090B",
    label: kind === "video" ? "Video" : kind === "image" ? "Image" : kind === "gradient" ? "Gradient" : "Solid",
  };
}

function createDefaultSongSlides(): SongSlide[] {
  return [
    { id: createId("slide"), label: "Verse 1", lyrics: "", background: null },
    { id: createId("slide"), label: "Verse 2", lyrics: "", background: null },
    { id: createId("slide"), label: "Pre-Chorus", lyrics: "", background: null },
    { id: createId("slide"), label: "Chorus", lyrics: "", background: null },
    { id: createId("slide"), label: "Bridge", lyrics: "", background: null },
    { id: createId("slide"), label: "Outro", lyrics: "", background: null },
  ];
}

function createDefaultTypography(): TypographySettings {
  return {
    fontSize: 58,
    weight: 800,
    color: "#ffffff",
    alignment: "center",
    glow: 58,
    overlay: 36,
  };
}

export { createDefaultTypography };

function seedSongs(): SongPresentation[] {
  return recentSongs.map((song, index) => {
    const createdAt = new Date(Date.now() - index * 86400000).toISOString();
    return {
      id: `seed_${index + 1}`,
      title: song.title,
      artist: song.artist,
      thumbnail: "from-violet-700 via-sky-700 to-emerald-500",
      slides: createDefaultSongSlides(),
      sections: ["Verse 1", "Chorus", "Bridge", "Outro"],
      backgrounds: [],
      typographySettings: createDefaultTypography(),
      transitions: "Fade",
      createdAt,
      updatedAt: createdAt,
      favorite: index % 3 === 0,
      lastUsedAt: null,
      usageCount: song.sections,
    };
  });
}

function createDefaultPlannerService(): PlannerService {
  const now = new Date().toISOString();
  const id = createId("planner");
  return {
    id,
    title: "Sunday Service",
    serviceDate: now.slice(0, 10),
    createdBy: "Alyssa",
    createdAt: now,
    updatedAt: now,
    items: [
      createPlannerItem(id, "timer"),
      createPlannerItem(id, "welcome"),
    ],
  };
}

function readRawStore(): WorshipflowStore {
  if (!isBrowser()) return emptyStore;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const cacheKey = raw ?? EMPTY_RAW;
  if (cachedRaw === cacheKey) {
    return cachedSnapshot;
  }

  if (!raw) {
    cachedRaw = cacheKey;
    cachedSnapshot = {
      songPresentations: seedSongs(),
      plannerServices: [createDefaultPlannerService()],
      historyRecords: [],
    };
    return cachedSnapshot;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<WorshipflowStore>;
    cachedRaw = cacheKey;
    cachedSnapshot = {
      songPresentations: Array.isArray(parsed.songPresentations) && parsed.songPresentations.length ? parsed.songPresentations : seedSongs(),
      plannerServices: Array.isArray(parsed.plannerServices) && parsed.plannerServices.length ? parsed.plannerServices : [createDefaultPlannerService()],
      historyRecords: Array.isArray(parsed.historyRecords) ? parsed.historyRecords : [],
    };
    return cachedSnapshot;
  } catch {
    cachedRaw = cacheKey;
    cachedSnapshot = {
      songPresentations: seedSongs(),
      plannerServices: [createDefaultPlannerService()],
      historyRecords: [],
    };
    return cachedSnapshot;
  }
}

function writeStore(store: WorshipflowStore) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  cachedRaw = window.localStorage.getItem(STORAGE_KEY) ?? EMPTY_RAW;
  cachedSnapshot = store;
  window.dispatchEvent(new Event(STORE_EVENT));
}

export function getStoreSnapshot(): WorshipflowStore {
  return readRawStore();
}

export function subscribeStore(listener: () => void) {
  if (!isBrowser()) return () => undefined;
  const handler = () => listener();
  window.addEventListener(STORE_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(STORE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function useWorshipflowStore(): WorshipflowStore {
  return useSyncExternalStore(subscribeStore, getStoreSnapshot, () => emptyStore);
}

export function persistStore(updater: (current: WorshipflowStore) => WorshipflowStore) {
  const next = updater(readRawStore());
  writeStore(next);
  return next;
}

export function createBackgroundAsset(partial: Partial<BackgroundAsset> & Pick<BackgroundAsset, "name" | "kind" | "value">): BackgroundAsset {
  return {
    id: partial.id ?? createId("bg"),
    name: partial.name,
    kind: partial.kind,
    value: partial.value,
    label: partial.label ?? partial.name,
    preview: partial.preview,
  };
}

export function createDefaultTimerSettings(): TimerSettings {
  return {
    hours: 0,
    minutes: 10,
    seconds: 0,
    title: "Service starts in",
    background: defaultBackground("gradient"),
  };
}

export function createDefaultWelcomeSettings(): WelcomeSettings {
  return {
    heading: "Welcome to WorshipFlow AI",
    subtitle: "We are glad you are here",
    churchName: "City Harvest Church Villamonte",
    serviceDate: new Date().toISOString().slice(0, 10),
    fontSize: 68,
    weight: 800,
    color: "#ffffff",
    alignment: "center",
    overlay: 42,
    background: defaultBackground("video"),
  };
}

export function normalizeSongPresentation(value: Partial<SongPresentation>): SongPresentation {
  const now = new Date().toISOString();
  return {
    id: value.id ?? createId("song"),
    title: value.title ?? "Untitled Worship Song",
    artist: value.artist ?? "Unknown Artist",
    thumbnail: value.thumbnail ?? "from-violet-700 via-sky-700 to-emerald-500",
    slides: Array.isArray(value.slides) && value.slides.length ? value.slides : createDefaultSongSlides(),
    sections: Array.isArray(value.sections) && value.sections.length ? value.sections : ["Verse 1", "Chorus", "Bridge", "Outro"],
    backgrounds: Array.isArray(value.backgrounds) ? value.backgrounds : [],
    typographySettings: value.typographySettings ?? createDefaultTypography(),
    transitions: value.transitions ?? "Fade",
    createdAt: value.createdAt ?? now,
    updatedAt: value.updatedAt ?? now,
    favorite: value.favorite ?? false,
    lastUsedAt: value.lastUsedAt ?? null,
    usageCount: value.usageCount ?? 0,
  };
}

export function backgroundLibraryOptions(): BackgroundAsset[] {
  return libraryBackgrounds.map((item, index) =>
    createBackgroundAsset({
      id: `library_${index}`,
      name: item.name,
      kind: "library",
      value: "videoUrl" in item && item.videoUrl ? item.videoUrl : "#09090B",
      label: item.tag,
      preview: "videoUrl" in item ? item.videoUrl : undefined,
    }),
  );
}

export function createPlannerItem(plannerServiceId: string, type: PlannerItemType, overrides: Partial<PlannerItem> = {}): PlannerItem {
  const baseBackground = createBackgroundAsset({
    name: "Solid Ink",
    kind: "solid",
    value: "#09090B",
    label: "Solid",
  });

  const timerSettings = createDefaultTimerSettings();
  const welcomeSettings = createDefaultWelcomeSettings();

  const defaults: Record<PlannerItemType, Partial<PlannerItem>> = {
    timer: {
      title: timerSettings.title,
      durationSeconds: timerSettings.hours * 3600 + timerSettings.minutes * 60 + timerSettings.seconds,
      background: timerSettings.background,
      settings: { timer: timerSettings },
    },
    welcome: {
      title: "Welcome",
      durationSeconds: 20,
      background: welcomeSettings.background,
      settings: { welcome: welcomeSettings },
    },
    song: {
      title: "Song",
      durationSeconds: 0,
      background: null,
      settings: {},
      songPresentationId: null,
    },
    bible: { title: "Bible Reading", durationSeconds: 0, background: baseBackground, settings: {} },
    announcement: { title: "Announcement", durationSeconds: 0, background: baseBackground, settings: {} },
    video: { title: "Video", durationSeconds: 0, background: baseBackground, settings: {} },
    prayer: { title: "Prayer", durationSeconds: 0, background: baseBackground, settings: {} },
    offering: { title: "Offering", durationSeconds: 0, background: baseBackground, settings: {} },
    communion: { title: "Communion", durationSeconds: 0, background: baseBackground, settings: {} },
    custom: { title: "Custom Item", durationSeconds: 0, background: baseBackground, settings: {} },
  };

  return {
    id: overrides.id ?? createId(type),
    plannerServiceId,
    type,
    order: overrides.order ?? 0,
    title: overrides.title ?? (defaults[type].title as string),
    durationSeconds: typeof overrides.durationSeconds === "number" ? overrides.durationSeconds : (defaults[type].durationSeconds as number) ?? 0,
    background: (overrides.background ?? defaults[type].background ?? null) as BackgroundAsset | null,
    settings: overrides.settings ?? (defaults[type].settings as Record<string, unknown>) ?? {},
    songPresentationId: overrides.songPresentationId ?? (defaults[type].songPresentationId as string | null) ?? null,
  };
}

export function createPlannerService(input?: Partial<PlannerService>) {
  const now = new Date().toISOString();
  const id = input?.id ?? createId("planner");
  return {
    id,
    title: input?.title ?? "Sunday Service",
    serviceDate: input?.serviceDate ?? now.slice(0, 10),
    createdBy: input?.createdBy ?? "Alyssa",
    createdAt: input?.createdAt ?? now,
    updatedAt: now,
    items: input?.items ?? [createPlannerItem(id, "timer"), createPlannerItem(id, "welcome")],
  } satisfies PlannerService;
}

export function savePlannerService(service: PlannerService) {
  return persistStore((current) => {
    const next = {
      ...service,
      updatedAt: new Date().toISOString(),
      items: service.items.map((item, index) => ({ ...item, order: index, plannerServiceId: service.id })),
    };
    const plannerServices = current.plannerServices.some((item) => item.id === service.id)
      ? current.plannerServices.map((item) => (item.id === service.id ? next : item))
      : [next, ...current.plannerServices];
    return { ...current, plannerServices };
  });
}

export function updatePlannerService(serviceId: string, patch: Partial<PlannerService>) {
  const service = getPlannerServiceById(serviceId);
  if (!service) return null;
  const next = { ...service, ...patch };
  savePlannerService(next);
  return next;
}

export function deletePlannerService(serviceId: string) {
  return persistStore((current) => ({
    ...current,
    plannerServices: current.plannerServices.filter((service) => service.id !== serviceId),
    historyRecords: current.historyRecords.filter((record) => record.plannerServiceId !== serviceId),
  }));
}

export function duplicatePlannerService(serviceId: string) {
  const store = readRawStore();
  const service = store.plannerServices.find((item) => item.id === serviceId);
  if (!service) return null;
  const clone = createPlannerService({
    title: `${service.title} Copy`,
    serviceDate: service.serviceDate,
    createdBy: service.createdBy,
  });
  clone.items = service.items.map((item, index) => ({ ...item, id: createId("item"), plannerServiceId: clone.id, order: index }));
  savePlannerService(clone);
  return clone;
}

export function saveHistoryFromPlanner(service: PlannerService, status: HistoryRecord["status"] = "presented") {
  const now = new Date().toISOString();
  return persistStore((current) => ({
    ...current,
    historyRecords: [
      {
        id: createId("history"),
        plannerServiceId: service.id,
        plannerTitle: service.title,
        serviceDate: service.serviceDate,
        createdBy: service.createdBy,
        createdAt: service.createdAt,
        presentedAt: now,
        status,
        sequenceSnapshot: service.items.map((item, index) => ({ ...item, order: index })),
      },
      ...current.historyRecords.filter((record) => record.plannerServiceId !== service.id),
    ],
    plannerServices: current.plannerServices.map((item) => (item.id === service.id ? { ...service, updatedAt: now } : item)),
  }));
}

export function getPlannerServiceById(serviceId: string) {
  return readRawStore().plannerServices.find((service) => service.id === serviceId) ?? null;
}

export function getSongPresentationById(songId: string) {
  return readRawStore().songPresentations.find((song) => song.id === songId) ?? null;
}

export function upsertSongPresentation(song: Partial<SongPresentation>) {
  return persistStore((current) => {
    const normalized = normalizeSongPresentation(song);
    const songPresentations = current.songPresentations.some((item) => item.id === normalized.id)
      ? current.songPresentations.map((item) => (item.id === normalized.id ? normalized : item))
      : [normalized, ...current.songPresentations];
    return { ...current, songPresentations };
  });
}

export function deleteSongPresentation(songId: string) {
  return persistStore((current) => ({
    ...current,
    songPresentations: current.songPresentations.filter((song) => song.id !== songId),
  }));
}

export function markSongUsed(songId: string) {
  return persistStore((current) => ({
    ...current,
    songPresentations: current.songPresentations.map((song) =>
      song.id === songId
        ? { ...song, usageCount: song.usageCount + 1, lastUsedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        : song,
    ),
  }));
}

export function upsertPlannerServiceItem(serviceId: string, item: PlannerItem) {
  const service = getPlannerServiceById(serviceId);
  if (!service) return null;
  const nextItems = service.items.some((entry) => entry.id === item.id)
    ? service.items.map((entry) => (entry.id === item.id ? item : entry))
    : [...service.items, item];
  const nextService = { ...service, items: nextItems.map((entry, index) => ({ ...entry, order: index, plannerServiceId: service.id })) };
  savePlannerService(nextService);
  return nextService;
}

export function reorderPlannerServiceItems(serviceId: string, items: PlannerItem[]) {
  const service = getPlannerServiceById(serviceId);
  if (!service) return null;
  const nextService = { ...service, items: items.map((item, index) => ({ ...item, order: index, plannerServiceId: service.id })) };
  savePlannerService(nextService);
  return nextService;
}

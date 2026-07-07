import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronRight, GripVertical, Image, Maximize2, Music2, Play, Type, Wand2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { Button } from "../components/button";
import { MagneticCard, Page } from "../components/motion";
import { backgrounds as baseBackgrounds } from "../data/workspace";
import { api } from "../lib/api";

type SongMeta = {
  title: string;
  artist: string;
  duration: string;
  thumbnail: string;
  youtubeUrl: string;
};

type LyricSection = {
  label: string;
  lyrics: string;
};

type Background = {
  name: string;
  tag: string;
  color: string;
  videoUrl?: string;
};

type Typography = {
  fontSize: number;
  weight: number;
  glow: number;
  overlay: number;
};

const steps = [
  { label: "Import", icon: Music2 },
  { label: "Backgrounds", icon: Image },
  { label: "Typography", icon: Type },
  { label: "Preview", icon: Play },
];

const standardSections: LyricSection[] = [
  { label: "Verse 1", lyrics: "" },
  { label: "Verse 2", lyrics: "" },
  { label: "Pre-Chorus", lyrics: "" },
  { label: "Chorus", lyrics: "" },
  { label: "Bridge", lyrics: "" },
  { label: "Outro", lyrics: "" },
];

const initialSections: LyricSection[] = standardSections.map((section) => ({ ...section }));

export function BuilderPage() {
  const [step, setStep] = useState(0);
  const [youtubeUrl, setYoutubeUrl] = useState("https://youtube.com/watch?v=goodness-of-god");
  const [loading, setLoading] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [rawLyrics, setRawLyrics] = useState("");
  const [backgrounds, setBackgrounds] = useState<Background[]>(baseBackgrounds);
  const [selectedBackground, setSelectedBackground] = useState<Background>(baseBackgrounds[0]);
  const [songMeta, setSongMeta] = useState<SongMeta>({
    title: "Untitled Worship Song",
    artist: "Not imported yet",
    duration: "0:00",
    thumbnail: "from-violet-700 via-sky-700 to-emerald-500",
    youtubeUrl: "",
  });
  const [sections, setSections] = useState<LyricSection[]>(initialSections);
  const [typography, setTypography] = useState<Typography>({
    fontSize: 58,
    weight: 800,
    glow: 62,
    overlay: 38,
  });

  useEffect(() => {
    const loadBackgrounds = async () => {
      try {
        const pack = await api<{ backgrounds: Background[] }>("/media/background-pack", { method: "POST" });
        setBackgrounds((current) => mergeBackgrounds(current, pack.data.backgrounds));
      } catch {
        // Keep bundled backgrounds available if the local API is not running.
      }
    };

    void loadBackgrounds();
  }, []);

  const importSong = async () => {
    if (!youtubeUrl.trim()) {
      toast.error("Paste a YouTube link first");
      return;
    }

    setLoading(true);
    try {
      const response = await api<{ title: string; artist: string; duration_seconds: number; youtube_url: string }>(
        "/songs/import-youtube",
        {
          method: "POST",
          body: JSON.stringify({ url: youtubeUrl }),
        },
      );
      const minutes = Math.floor(response.data.duration_seconds / 60);
      const seconds = String(response.data.duration_seconds % 60).padStart(2, "0");
      const nextMeta = {
        title: response.data.title,
        artist: response.data.artist,
        duration: `${minutes}:${seconds}`,
        thumbnail: "from-fuchsia-700 via-blue-700 to-emerald-500",
        youtubeUrl: response.data.youtube_url,
      };

      setSongMeta(nextMeta);

      const lyrics = await api<{ found: boolean; sections: LyricSection[]; message: string }>("/lyrics/search", {
        method: "POST",
        body: JSON.stringify({ title: nextMeta.title, artist: nextMeta.artist }),
      });
      if (lyrics.data.found && lyrics.data.sections.length) {
        setSections(withStandardSections(lyrics.data.sections));
      } else {
        const empty = await api<{ sections: LyricSection[] }>("/ai/lyrics/split", {
          method: "POST",
          body: JSON.stringify({ title: nextMeta.title, artist: nextMeta.artist }),
        });
        setSections(withStandardSections(empty.data.sections));
      }

      const pack = await api<{ backgrounds: Background[] }>("/media/background-pack", { method: "POST" });
      setBackgrounds((current) => mergeBackgrounds(current, pack.data.backgrounds));

      toast.success(lyrics.data.found ? "Song and licensed lyrics matched automatically" : "Song matched; no licensed lyrics provider configured");
      setStep(1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not import YouTube link");
    } finally {
      setLoading(false);
    }
  };

  const saveAndPresent = async () => {
    if (!sections.some((section) => section.lyrics.trim())) {
      toast.error("Paste or type lyrics before presenting");
      setStep(0);
      return;
    }

    const response = await api<{ id: string }>("/presentations", {
      method: "POST",
      body: JSON.stringify({
        title: songMeta.title,
        artist: songMeta.artist,
        sections,
        background: selectedBackground.name,
        typography,
      }),
    });
    toast.success(`Saved ${response.data.id}`);
    setPresenting(true);
  };

  const splitPastedLyrics = async () => {
    if (!rawLyrics.trim()) {
      toast.error("Paste lyrics into the editor first");
      return;
    }

    const lyrics = await api<{ sections: LyricSection[] }>("/ai/lyrics/split", {
      method: "POST",
      body: JSON.stringify({
        title: songMeta.title,
        artist: songMeta.artist,
        raw_lyrics: rawLyrics,
      }),
    });
    const nextSections = withStandardSections(lyrics.data.sections);
    setSections(nextSections);
    toast.success(`${nextSections.length} lyric sections ready`);
  };

  const reorderSections = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;

    setSections((current) => {
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  return (
    <Page className="px-4 py-6 md:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-mint">Presentation Builder</p>
          <h2 className="font-display text-4xl font-black tracking-[-0.02em]">From YouTube link to live slides.</h2>
        </div>
        <Button onClick={importSong} disabled={loading}>
          <Wand2 className="h-4 w-4" /> {loading ? "Building..." : "AI build"}
        </Button>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-4">
        {steps.map((item, index) => (
          <button
            key={item.label}
            onClick={() => setStep(index)}
            className={`rounded-2xl border p-4 text-left transition ${
              step === index ? "border-mint/50 bg-mint/10" : "border-white/8 bg-white/[0.04] hover:bg-white/[0.07]"
            }`}
          >
            <item.icon className="mb-4 h-5 w-5 text-mint" />
            <p className="font-semibold">
              {index + 1}. {item.label}
            </p>
          </button>
        ))}
      </div>

      <motion.div key={step} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        {step === 0 && (
          <ImportStep
            loading={loading}
            youtubeUrl={youtubeUrl}
            setYoutubeUrl={setYoutubeUrl}
            importSong={importSong}
            songMeta={songMeta}
            sections={sections}
            setSections={setSections}
            rawLyrics={rawLyrics}
            setRawLyrics={setRawLyrics}
            splitPastedLyrics={splitPastedLyrics}
            reorderSections={reorderSections}
          />
        )}
        {step === 1 && (
          <BackgroundStep
            backgrounds={backgrounds}
            selectedBackground={selectedBackground}
            setSelectedBackground={setSelectedBackground}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <TypographyStep
            typography={typography}
            setTypography={setTypography}
            selectedBackground={selectedBackground}
            sections={sections}
            setSections={setSections}
            onNext={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <PreviewStep
            songMeta={songMeta}
            sections={sections}
            selectedBackground={selectedBackground}
            typography={typography}
            saveAndPresent={saveAndPresent}
            reorderSections={reorderSections}
          />
        )}
      </motion.div>

      <AnimatePresence>
        {presenting && (
          <FullscreenPresentation
            songMeta={songMeta}
            sections={sections}
            background={selectedBackground}
            typography={typography}
            onClose={() => setPresenting(false)}
          />
        )}
      </AnimatePresence>
    </Page>
  );
}

function ImportStep({
  loading,
  youtubeUrl,
  setYoutubeUrl,
  importSong,
  songMeta,
  sections,
  setSections,
  rawLyrics,
  setRawLyrics,
  splitPastedLyrics,
  reorderSections,
}: {
  loading: boolean;
  youtubeUrl: string;
  setYoutubeUrl: (url: string) => void;
  importSong: () => void;
  songMeta: SongMeta;
  sections: LyricSection[];
  setSections: (sections: LyricSection[]) => void;
  rawLyrics: string;
  setRawLyrics: (lyrics: string) => void;
  splitPastedLyrics: () => void;
  reorderSections: (fromIndex: number, toIndex: number) => void;
}) {
  const updateSection = (index: number, lyrics: string) => {
    setSections(sections.map((section, sectionIndex) => (sectionIndex === index ? { ...section, lyrics } : section)));
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
      <MagneticCard className="p-5">
        <label className="text-sm text-zinc-400">YouTube Link</label>
        <input
          className="mt-3 w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-4 outline-none"
          value={youtubeUrl}
          onChange={(event) => setYoutubeUrl(event.target.value)}
          placeholder="Paste any YouTube worship song link"
        />
        <Button className="mt-4 w-full" onClick={importSong} disabled={loading}>
          <Music2 className="h-4 w-4" /> {loading ? "Importing..." : "Fetch song metadata and continue"}
        </Button>
        <div className="mt-5 rounded-2xl border border-white/8 bg-white/[0.04] p-4">
          <div className={`h-44 rounded-2xl bg-gradient-to-br ${songMeta.thumbnail}`} />
          <h3 className="mt-4 font-display text-2xl font-bold">{songMeta.title}</h3>
          <p className="text-zinc-500">
            {songMeta.artist} - {songMeta.duration} - {songMeta.youtubeUrl ? "Metadata fetched" : "Waiting for import"}
          </p>
        </div>
      </MagneticCard>

      <MagneticCard className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-2xl font-bold">AI lyrics editor</h3>
            <p className="mt-1 text-sm text-zinc-500">Paste licensed lyrics, split them, then edit every slide before presenting.</p>
          </div>
          <Button variant="secondary" onClick={importSong} disabled={loading}>
            <Wand2 className="h-4 w-4" /> Regenerate
          </Button>
        </div>
        <div className="mt-5 rounded-2xl border border-white/8 bg-white/[0.04] p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-white">Paste lyrics</p>
            <Button variant="secondary" onClick={splitPastedLyrics}>
              <Wand2 className="h-4 w-4" /> Auto split pasted lyrics
            </Button>
          </div>
          <textarea
            className="min-h-36 w-full resize-y rounded-2xl border border-white/8 bg-black/20 p-4 text-sm leading-6 text-zinc-200 outline-none placeholder:text-zinc-600"
            value={rawLyrics}
            onChange={(event) => setRawLyrics(event.target.value)}
            placeholder="Paste lyrics you have rights to use. Blank lines separate slides."
          />
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {sections.map((slide, index) => (
            <div
              key={`${slide.label}-${index}`}
              draggable
              onDragStart={(event) => event.dataTransfer.setData("text/plain", String(index))}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                reorderSections(Number(event.dataTransfer.getData("text/plain")), index);
              }}
              className="rounded-2xl border border-white/8 bg-white/[0.04] p-4"
            >
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-mint">
                <GripVertical className="h-4 w-4 cursor-grab text-zinc-500" />
                <Check className="h-4 w-4" /> {slide.label}
              </p>
              {!slide.lyrics.trim() && (
                <p className="mb-2 rounded-xl border border-dashed border-white/10 bg-black/20 px-3 py-2 text-xs text-zinc-500">
                  Empty section. Type or paste lyrics here, or leave blank if the song does not use this part.
                </p>
              )}
              <textarea
                className="min-h-28 w-full resize-none bg-transparent text-sm leading-6 text-zinc-300 outline-none"
                value={slide.lyrics}
                placeholder="Type or paste lyrics for this slide"
                onChange={(event) => updateSection(index, event.target.value)}
              />
            </div>
          ))}
        </div>
      </MagneticCard>
    </div>
  );
}

function BackgroundStep({
  backgrounds,
  selectedBackground,
  setSelectedBackground,
  onNext,
}: {
  backgrounds: Background[];
  selectedBackground: Background;
  setSelectedBackground: (background: Background) => void;
  onNext: () => void;
}) {
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-2xl font-bold">Choose a motion background</h3>
          <p className="text-sm text-zinc-500">More video-style backgrounds are loaded automatically after import.</p>
        </div>
        <Button onClick={onNext}>
          Continue to typography <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {backgrounds.map((background) => {
          const active = background.name === selectedBackground.name;
          return (
            <button
              key={background.name}
              onClick={() => {
                setSelectedBackground(background);
                toast.success(`${background.name} selected`);
              }}
              className="text-left"
            >
              <MagneticCard className={`overflow-hidden ${active ? "ring-2 ring-mint/70" : ""}`}>
                <div className={`relative h-48 overflow-hidden bg-gradient-to-br ${background.color}`}>
                  {background.videoUrl ? (
                    <video className="absolute inset-0 h-full w-full object-cover" src={background.videoUrl} autoPlay muted loop playsInline />
                  ) : (
                    <div className="absolute inset-0 animate-pulse bg-white/10" />
                  )}
                  <div className="absolute inset-0 bg-black/15" />
                  {active && <div className="absolute right-3 top-3 rounded-full bg-mint px-3 py-1 text-xs font-bold text-ink">Selected</div>}
                </div>
                <div className="p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-mint">{background.tag}</p>
                  <h3 className="mt-2 font-display text-xl font-bold">{background.name}</h3>
                </div>
              </MagneticCard>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TypographyStep({
  typography,
  setTypography,
  selectedBackground,
  sections,
  setSections,
  onNext,
}: {
  typography: Typography;
  setTypography: (typography: Typography) => void;
  selectedBackground: Background;
  sections: LyricSection[];
  setSections: (sections: LyricSection[]) => void;
  onNext: () => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = sections[activeIndex] ?? sections[0] ?? initialSections[0];
  const setValue = (key: keyof Typography, value: number) => setTypography({ ...typography, [key]: value });
  const updateActiveLyrics = (lyrics: string) => {
    setSections(sections.map((section, index) => (index === activeIndex ? { ...section, lyrics } : section)));
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[0.74fr_1.26fr]">
      <MagneticCard className="space-y-5 p-5">
        <div>
          <p className="mb-2 text-sm text-zinc-400">Edit slide text</p>
          <div className="mb-3 flex flex-wrap gap-2">
            {sections.map((section, index) => (
              <button
                key={`${section.label}-${index}`}
                onClick={() => setActiveIndex(index)}
                className={`rounded-full border px-3 py-1.5 text-xs ${
                  activeIndex === index ? "border-mint/50 bg-mint/10 text-white" : "border-white/10 bg-white/[0.04] text-zinc-400"
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>
          <textarea
            className="min-h-28 w-full resize-y rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-zinc-200 outline-none"
            value={activeSlide.lyrics}
            placeholder="Edit lyrics for this slide"
            onChange={(event) => updateActiveLyrics(event.target.value)}
          />
        </div>
        <Slider label="Font size" value={typography.fontSize} min={36} max={86} onChange={(value) => setValue("fontSize", value)} />
        <Slider label="Font weight" value={typography.weight} min={500} max={900} step={100} onChange={(value) => setValue("weight", value)} />
        <Slider label="Glow" value={typography.glow} min={0} max={100} onChange={(value) => setValue("glow", value)} />
        <Slider label="Overlay opacity" value={typography.overlay} min={0} max={80} onChange={(value) => setValue("overlay", value)} />
        <Button className="w-full" onClick={onNext}>
          Continue to preview <ChevronRight className="h-4 w-4" />
        </Button>
      </MagneticCard>
      <SlideCanvas background={selectedBackground} section={activeSlide} typography={typography} label="Live typography preview" />
    </div>
  );
}

function Slider({
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
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        className="w-full accent-mint"
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function PreviewStep({
  songMeta,
  sections,
  selectedBackground,
  typography,
  saveAndPresent,
  reorderSections,
}: {
  songMeta: SongMeta;
  sections: LyricSection[];
  selectedBackground: Background;
  typography: Typography;
  saveAndPresent: () => void;
  reorderSections: (fromIndex: number, toIndex: number) => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = sections[activeIndex] ?? sections[0] ?? initialSections[0];

  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <SlideCanvas background={selectedBackground} section={activeSlide} typography={typography} label={songMeta.title} />
      <div className="space-y-4">
        <MagneticCard className="p-5">
          <h3 className="font-display text-xl font-bold">{songMeta.title}</h3>
          <p className="mt-2 text-zinc-500">
            {songMeta.artist} - {sections.length} lyric slides - {selectedBackground.name}
          </p>
        </MagneticCard>
        <MagneticCard className="p-5">
          <h3 className="mb-4 font-display text-xl font-bold">Slide navigator</h3>
          <div className="space-y-2">
            {sections.map((section, index) => (
              <button
                key={`${section.label}-${index}`}
                draggable
                onDragStart={(event) => event.dataTransfer.setData("text/plain", String(index))}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  reorderSections(Number(event.dataTransfer.getData("text/plain")), index);
                  setActiveIndex(index);
                }}
                onClick={() => setActiveIndex(index)}
                className={`w-full rounded-2xl border px-3 py-3 text-left text-sm ${
                  activeIndex === index ? "border-mint/50 bg-mint/10" : "border-white/8 bg-white/[0.04] hover:bg-white/[0.08]"
                }`}
              >
                <span className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-zinc-500" />
                  {section.label}
                </span>
              </button>
            ))}
          </div>
        </MagneticCard>
        <Button className="w-full" onClick={saveAndPresent}>
          <Maximize2 className="h-4 w-4" /> Save and present fullscreen
        </Button>
      </div>
    </div>
  );
}

function SlideCanvas({
  background,
  section,
  typography,
  label,
}: {
  background: Background;
  section: LyricSection;
  typography: Typography;
  label: string;
}) {
  const shadow = `0 0 ${Math.round(typography.glow / 2)}px rgba(255,255,255,0.6)`;
  const displayLyrics = section.lyrics.trim() || "Lyrics not added yet";

  return (
    <MagneticCard className={`grid min-h-[540px] place-items-center bg-gradient-to-br ${background.color} p-8 text-center`}>
      {background.videoUrl && (
        <video className="absolute inset-0 h-full w-full object-cover" src={background.videoUrl} autoPlay muted loop playsInline />
      )}
      <div className="absolute inset-0 bg-black" style={{ opacity: typography.overlay / 100 }} />
      <div className="relative">
        <p className="mb-6 text-sm font-semibold uppercase tracking-[0.32em] text-white/60">{section.label}</p>
        <p
          className="font-display leading-tight text-white"
          style={{
            fontSize: typography.fontSize,
            fontWeight: typography.weight,
            textShadow: shadow,
          }}
        >
          {displayLyrics}
        </p>
        <p className="mt-8 text-sm uppercase tracking-[0.3em] text-white/60">{label}</p>
      </div>
    </MagneticCard>
  );
}

function FullscreenPresentation({
  songMeta,
  sections,
  background,
  typography,
  onClose,
}: {
  songMeta: SongMeta;
  sections: LyricSection[];
  background: Background;
  typography: Typography;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const activeSlide = sections[index] ?? sections[0] ?? initialSections[0];
  const shadow = `0 0 ${Math.round(typography.glow / 1.5)}px rgba(255,255,255,0.72)`;

  useEffect(() => {
    document.documentElement.requestFullscreen?.().catch(() => undefined);
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        document.exitFullscreen?.().catch(() => undefined);
        onClose();
      }
      if (event.key === "ArrowRight" || event.key === " ") {
        setIndex((value) => Math.min(value + 1, sections.length - 1));
      }
      if (event.key === "ArrowLeft") {
        setIndex((value) => Math.max(value - 1, 0));
      }
    };
    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, [onClose, sections.length]);

  return createPortal(
    <motion.div
      className={`fixed inset-0 z-[9999] grid h-[100dvh] w-[100dvw] place-items-center overflow-hidden bg-gradient-to-br ${background.color} p-8 text-center text-white`}
      initial={{ opacity: 0, scale: 1.02 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.35 }}
    >
      {background.videoUrl && (
        <video className="absolute inset-0 h-full w-full object-cover" src={background.videoUrl} autoPlay muted loop playsInline />
      )}
      <div className="absolute inset-0 bg-black" style={{ opacity: typography.overlay / 100 }} />
      <button
        onClick={() => {
          document.exitFullscreen?.().catch(() => undefined);
          onClose();
        }}
        className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/30 text-white backdrop-blur-xl"
        aria-label="Exit presentation"
      >
        <X className="h-5 w-5" />
      </button>
      <div className="absolute bottom-5 left-5 rounded-full border border-white/15 bg-black/30 px-4 py-2 text-sm text-white/70 backdrop-blur-xl">
        {index + 1} / {sections.length} - ESC exits - arrows navigate
      </div>
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 18, filter: "blur(12px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.38 }}
        className="relative max-w-6xl"
      >
        <p className="mb-8 text-sm font-semibold uppercase tracking-[0.36em] text-white/60">{activeSlide.label}</p>
        <p
          className="whitespace-pre-line font-display leading-tight"
          style={{
            fontSize: `clamp(42px, ${Math.max(typography.fontSize / 12, 5)}vw, 108px)`,
            fontWeight: typography.weight,
            textShadow: shadow,
          }}
        >
          {activeSlide.lyrics}
        </p>
      </motion.div>
    </motion.div>,
    document.body,
  );
}

function mergeBackgrounds(current: Background[], incoming: Background[]) {
  const names = new Set(current.map((item) => item.name));
  return [...current, ...incoming.filter((item) => !names.has(item.name))];
}

function withStandardSections(sections: LyricSection[]) {
  const normalized = sections.map((section) => ({
    ...section,
    label: normalizeSectionName(section.label),
  }));
  const labels = new Set(normalized.map((section) => section.label.toLowerCase()));
  const missing = standardSections.filter((section) => !labels.has(section.label.toLowerCase()));

  return [...normalized, ...missing.map((section) => ({ ...section }))];
}

function normalizeSectionName(label: string) {
  const clean = label.trim().toLowerCase().replace(/\s+/g, " ");

  if (clean === "pre chorus" || clean === "prechorus") return "Pre-Chorus";
  if (clean === "verse") return "Verse 1";
  if (clean === "verse 1" || clean === "v1") return "Verse 1";
  if (clean === "verse 2" || clean === "v2") return "Verse 2";
  if (clean === "chorus") return "Chorus";
  if (clean === "bridge") return "Bridge";
  if (clean === "outro" || clean === "ending") return "Outro";

  return label;
}

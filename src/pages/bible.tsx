import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, ChevronLeft, ChevronRight, Maximize2, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { Button } from "../components/button";
import { MagneticCard, Page } from "../components/motion";
import { api } from "../lib/api";

type BibleBook = {
  name: string;
  chapters: number;
};

type BibleVerse = {
  book: string;
  chapter: number;
  verse: number;
  text: string;
};

type BibleResponse = {
  reference: string;
  translation: string;
  source: string;
  verses: BibleVerse[];
};

const bibleBooks: BibleBook[] = [
  { name: "Genesis", chapters: 50 }, { name: "Exodus", chapters: 40 }, { name: "Leviticus", chapters: 27 },
  { name: "Numbers", chapters: 36 }, { name: "Deuteronomy", chapters: 34 }, { name: "Joshua", chapters: 24 },
  { name: "Judges", chapters: 21 }, { name: "Ruth", chapters: 4 }, { name: "1 Samuel", chapters: 31 },
  { name: "2 Samuel", chapters: 24 }, { name: "1 Kings", chapters: 22 }, { name: "2 Kings", chapters: 25 },
  { name: "1 Chronicles", chapters: 29 }, { name: "2 Chronicles", chapters: 36 }, { name: "Ezra", chapters: 10 },
  { name: "Nehemiah", chapters: 13 }, { name: "Esther", chapters: 10 }, { name: "Job", chapters: 42 },
  { name: "Psalm", chapters: 150 }, { name: "Proverbs", chapters: 31 }, { name: "Ecclesiastes", chapters: 12 },
  { name: "Song of Solomon", chapters: 8 }, { name: "Isaiah", chapters: 66 }, { name: "Jeremiah", chapters: 52 },
  { name: "Lamentations", chapters: 5 }, { name: "Ezekiel", chapters: 48 }, { name: "Daniel", chapters: 12 },
  { name: "Hosea", chapters: 14 }, { name: "Joel", chapters: 3 }, { name: "Amos", chapters: 9 },
  { name: "Obadiah", chapters: 1 }, { name: "Jonah", chapters: 4 }, { name: "Micah", chapters: 7 },
  { name: "Nahum", chapters: 3 }, { name: "Habakkuk", chapters: 3 }, { name: "Zephaniah", chapters: 3 },
  { name: "Haggai", chapters: 2 }, { name: "Zechariah", chapters: 14 }, { name: "Malachi", chapters: 4 },
  { name: "Matthew", chapters: 28 }, { name: "Mark", chapters: 16 }, { name: "Luke", chapters: 24 },
  { name: "John", chapters: 21 }, { name: "Acts", chapters: 28 }, { name: "Romans", chapters: 16 },
  { name: "1 Corinthians", chapters: 16 }, { name: "2 Corinthians", chapters: 13 }, { name: "Galatians", chapters: 6 },
  { name: "Ephesians", chapters: 6 }, { name: "Philippians", chapters: 4 }, { name: "Colossians", chapters: 4 },
  { name: "1 Thessalonians", chapters: 5 }, { name: "2 Thessalonians", chapters: 3 }, { name: "1 Timothy", chapters: 6 },
  { name: "2 Timothy", chapters: 4 }, { name: "Titus", chapters: 3 }, { name: "Philemon", chapters: 1 },
  { name: "Hebrews", chapters: 13 }, { name: "James", chapters: 5 }, { name: "1 Peter", chapters: 5 },
  { name: "2 Peter", chapters: 3 }, { name: "1 John", chapters: 5 }, { name: "2 John", chapters: 1 },
  { name: "3 John", chapters: 1 }, { name: "Jude", chapters: 1 }, { name: "Revelation", chapters: 22 },
];

export function BiblePage() {
  const [book, setBook] = useState<BibleBook>(bibleBooks.find((item) => item.name === "John") ?? bibleBooks[0]);
  const [chapter, setChapter] = useState(3);
  const [query, setQuery] = useState("John 3:16");
  const [loading, setLoading] = useState(false);
  const [passage, setPassage] = useState<BibleResponse | null>(null);
  const [selected, setSelected] = useState<BibleVerse[]>([]);
  const [activeVerse, setActiveVerse] = useState<BibleVerse | null>(null);
  const [presenting, setPresenting] = useState(false);

  const chapters = useMemo(() => Array.from({ length: book.chapters }, (_, index) => index + 1), [book]);

  const loadChapter = async (nextBook = book, nextChapter = chapter, select: "first" | "last" | "none" = "first") => {
    setLoading(true);
    try {
      const response = await api<BibleResponse>(
        `/bible/chapter?book=${encodeURIComponent(nextBook.name)}&chapter=${nextChapter}`,
      );
      setPassage(response.data);
      const nextVerse =
        select === "first"
          ? response.data.verses[0]
          : select === "last"
            ? response.data.verses[response.data.verses.length - 1]
            : null;
      setActiveVerse(nextVerse ?? null);
      setSelected(response.data.verses);
      setBook(nextBook);
      setChapter(nextChapter);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load chapter");
    } finally {
      setLoading(false);
    }
  };

  const searchReference = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const response = await api<BibleResponse>(`/bible/search?q=${encodeURIComponent(query)}`);
      setPassage(response.data);
      setSelected(response.data.verses);
      setActiveVerse(response.data.verses[0] ?? null);
      toast.success(`${response.data.reference} loaded`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not search Bible");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadChapter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleVerse = (verse: BibleVerse) => {
    const key = verseKey(verse);
    setActiveVerse(verse);
    setSelected((current) =>
      current.some((item) => verseKey(item) === key)
        ? current.filter((item) => verseKey(item) !== key)
        : [...current, verse],
    );
  };

  const selectAdjacentVerse = (direction: -1 | 1) => {
    const verses = passage?.verses ?? [];
    if (verses.length === 0) return;

    const currentKey = activeVerse ? verseKey(activeVerse) : selected.length ? verseKey(selected[selected.length - 1]) : "";
    const currentIndex = verses.findIndex((verse) => verseKey(verse) === currentKey);
    const nextIndex = currentIndex === -1 ? (direction === 1 ? 0 : verses.length - 1) : currentIndex + direction;

    if (nextIndex >= 0 && nextIndex < verses.length) {
      setActiveVerse(verses[nextIndex]);
      return;
    }

    if (direction === -1 && chapter > 1) {
      void loadChapter(book, chapter - 1, "last");
      return;
    }

    if (direction === 1 && chapter < book.chapters) {
      void loadChapter(book, chapter + 1, "first");
    }
  };

  const startPresentation = () => {
    if (selected.length === 0) {
      toast.error("Select at least one verse to present");
      return;
    }
    setPresenting(true);
  };

  return (
    <Page className="px-4 py-6 md:px-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-mint">Bible Presenter</p>
          <h2 className="font-display text-4xl font-black">Scripture reader and presentation view</h2>
        </div>
        <Button onClick={startPresentation}>
          <Maximize2 className="h-4 w-4" /> Present selected
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[300px_1fr]">
        <MagneticCard className="max-h-[78vh] overflow-hidden p-4">
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-2">
            <Search className="h-4 w-4 text-zinc-500" />
            <input
              className="w-full bg-transparent text-sm outline-none"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && searchReference()}
              placeholder="John 3:16, Romans 8..."
            />
          </div>
          <Button className="mb-4 w-full" onClick={searchReference} disabled={loading}>
            <Search className="h-4 w-4" /> Search reference
          </Button>
          <div className="max-h-[60vh] space-y-1 overflow-y-auto pr-1">
            {bibleBooks.map((item) => (
              <button
                key={item.name}
                onClick={() => loadChapter(item, 1)}
                className={`flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-sm transition ${
                  item.name === book.name ? "bg-mint/10 text-white" : "text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                <span>{item.name}</span>
                <span className="text-xs text-zinc-600">{item.chapters}</span>
              </button>
            ))}
          </div>
        </MagneticCard>

        <MagneticCard className="p-5">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-mint">{passage?.translation ?? "WEB"}</p>
              <h3 className="font-display text-3xl font-black">{passage?.reference ?? `${book.name} ${chapter}`}</h3>
              <p className="mt-1 text-xs text-zinc-500">Source: {passage?.source ?? "loading"}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => selectAdjacentVerse(-1)}>
                <ChevronLeft className="h-4 w-4" />
                Prev verse
              </Button>
              <Button variant="secondary" onClick={() => selectAdjacentVerse(1)}>
                Next verse
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="mb-5 flex max-h-24 flex-wrap gap-2 overflow-y-auto rounded-2xl border border-white/8 bg-white/[0.03] p-3">
            {chapters.map((item) => (
              <button
                key={item}
                onClick={() => loadChapter(book, item)}
                className={`grid h-9 w-9 place-items-center rounded-xl text-sm ${
                  item === chapter ? "bg-mint text-ink" : "bg-white/[0.06] text-zinc-400 hover:bg-white/[0.1]"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          {activeVerse && (
            <div className="mb-5 rounded-2xl border border-mint/20 bg-mint/10 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-mint">
                Current verse - {activeVerse.book} {activeVerse.chapter}:{activeVerse.verse}
              </p>
              <p className="text-sm leading-6 text-zinc-200">{activeVerse.text.replace(/\s+/g, " ").trim()}</p>
            </div>
          )}
          <div className="grid gap-3">
            {(passage?.verses ?? []).map((verse) => {
              const active = selected.some((item) => verseKey(item) === verseKey(verse));
              const focused = activeVerse ? verseKey(activeVerse) === verseKey(verse) : false;
              return (
                <button
                  key={verseKey(verse)}
                  onClick={() => toggleVerse(verse)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    focused
                      ? "border-mint bg-mint/15 ring-2 ring-mint/20"
                      : active
                        ? "border-mint/50 bg-mint/10"
                        : "border-white/8 bg-white/[0.04] hover:bg-white/[0.07]"
                  }`}
                >
                  <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-mint">
                    <BookOpen className="h-4 w-4" /> {verse.book} {verse.chapter}:{verse.verse}
                  </p>
                  <p className="font-display text-xl font-bold leading-8">{verse.text}</p>
                </button>
              );
            })}
          </div>
        </MagneticCard>
      </div>

      <AnimatePresence>
        {presenting && <BiblePresentation verses={selected} onClose={() => setPresenting(false)} />}
      </AnimatePresence>
    </Page>
  );
}

function BiblePresentation({ verses, onClose }: { verses: BibleVerse[]; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const verse = verses[index];
  const close = () => {
    document.exitFullscreen?.().catch(() => undefined);
    onClose();
  };

  useEffect(() => {
    document.documentElement.requestFullscreen?.().catch(() => undefined);
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
      if (event.key === "ArrowRight" || event.key === " ") {
        setIndex((value) => Math.min(value + 1, verses.length - 1));
      }
      if (event.key === "ArrowLeft") {
        setIndex((value) => Math.max(value - 1, 0));
      }
    };
    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, [verses.length]);

  if (!verse) return null;
  const verseText = verse.text.replace(/\s+/g, " ").trim();
  const fontSize =
    verseText.length > 260
      ? "clamp(20px,2.5vw,34px)"
      : verseText.length > 190
        ? "clamp(24px,3vw,42px)"
        : verseText.length > 130
          ? "clamp(30px,3.7vw,54px)"
          : "clamp(40px,5.2vw,82px)";

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[9999] h-[100dvh] max-h-[100dvh] w-[100dvw] overflow-hidden bg-[radial-gradient(circle_at_50%_20%,rgba(56,189,248,0.24),transparent_34%),linear-gradient(135deg,#020617,#09090B_45%,#064e3b)] text-center text-white"
      initial={{ opacity: 0, scale: 1.02 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
    >
      <button
        onClick={() => {
          close();
        }}
        className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/30 backdrop-blur-xl"
        aria-label="Exit Bible presentation"
      >
        <X className="h-5 w-5" />
      </button>
      <div className="absolute bottom-5 left-5 rounded-full border border-white/15 bg-black/30 px-4 py-2 text-sm text-white/70 backdrop-blur-xl">
        {index + 1} / {verses.length} - ESC exits - arrows navigate
      </div>
      <motion.div
        key={verseKey(verse)}
        initial={{ opacity: 0, y: 18, filter: "blur(12px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.38 }}
        className="flex h-[100dvh] max-h-[100dvh] w-[100dvw] flex-col items-center justify-center px-[6vw] py-[9vh]"
      >
        <p className="mb-[4vh] shrink-0 text-xs font-semibold uppercase tracking-[0.32em] text-mint md:text-sm">
          {verse.book} {verse.chapter}:{verse.verse}
        </p>
        <p
          className="max-h-[68vh] max-w-[88vw] overflow-hidden text-balance break-words font-display font-black leading-[1.02] text-white drop-shadow-[0_0_28px_rgba(255,255,255,0.32)]"
          style={{ fontSize, overflowWrap: "anywhere" }}
        >
          {verseText}
        </p>
      </motion.div>
    </motion.div>,
    document.body,
  );
}

function verseKey(verse: BibleVerse) {
  return `${verse.book}-${verse.chapter}-${verse.verse}`;
}

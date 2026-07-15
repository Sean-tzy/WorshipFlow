import {
  Activity,
  BadgeCheck,
  CalendarDays,
  Clapperboard,
  FolderOpen,
  Heart,
  Home,
  Library,
  BookOpen,
  Mic2,
  Music2,
  Palette,
  Settings,
  Sparkles,
  Wand2,
} from "lucide-react";

export const navItems = [
  { label: "Dashboard", href: "/app", icon: Home },
  { label: "Builder", href: "/app/builder", icon: Wand2 },
  { label: "Bible", href: "/app/bible", icon: BookOpen },
  { label: "Planner", href: "/app/planner", icon: CalendarDays },
  { label: "Media", href: "/app/media", icon: FolderOpen },
  { label: "History", href: "/app/history", icon: Library },
  { label: "Settings", href: "/app/settings", icon: Settings },
];

export const metrics = [
  { label: "Presentations", value: "284", delta: "+18%", icon: Clapperboard },
  { label: "Songs Ready", value: "1,426", delta: "+42", icon: Music2 },
  { label: "Media Used", value: "68%", delta: "1.8 TB", icon: Activity },
  { label: "AI Saves", value: "37 hrs", delta: "this month", icon: Sparkles },
];

export const recentSongs = [
  { title: "Goodness of God", artist: "Bethel Music", tone: "emerald", sections: 8 },
  { title: "Gratitude", artist: "Brandon Lake", tone: "violet", sections: 7 },
  { title: "What A Beautiful Name", artist: "Hillsong Worship", tone: "blue", sections: 9 },
  { title: "King of Kings", artist: "Hillsong Worship", tone: "pink", sections: 6 },
];

export const activity = [
  "Alyssa generated slides for Sunday Opener",
  "Pastor Mark added Romans 8:31-39 to July 12",
  "AI split 42 lyric sections with chorus detection",
  "Media team uploaded 18 motion backgrounds",
];

export const backgrounds = [
  {
    name: "Easy Worship Rustic",
    tag: "Loop Video",
    color: "from-stone-950 via-amber-800 to-zinc-900",
    videoUrl: "/media/backgrounds/easy-worship-background-rustic.mp4",
  },
  {
    name: "Neon Tri-Tunnel",
    tag: "Loop Video",
    color: "from-fuchsia-950 via-cyan-500 to-violet-900",
    videoUrl: "/media/backgrounds/easy-worship-background-neon-tri-tunnel.mp4",
  },
  {
    name: "4K Clean Blue Motion",
    tag: "4K Loop Video",
    color: "from-blue-950 via-cyan-600 to-sky-200",
    videoUrl: "/media/backgrounds/4k-6-min-clean-blue-longest-ever-2160p-motion-background-uhd-aa-vfx.mp4",
  },
  {
    name: "Blinking Background Graphics",
    tag: "HD Loop Video",
    color: "from-zinc-950 via-indigo-700 to-cyan-300",
    videoUrl: "/media/backgrounds/blinking-background-graphics-hd.mp4",
  },
  {
    name: "Clean Bokeh",
    tag: "HD Loop Video",
    color: "from-slate-950 via-violet-700 to-rose-200",
    videoUrl: "/media/backgrounds/clean-bokeh-hd-motion-graphics-background-loop.mp4",
  },
  {
    name: "Clouds Motion Loop",
    tag: "HD Loop Video",
    color: "from-sky-950 via-blue-400 to-white",
    videoUrl: "/media/backgrounds/clouds-motion-background-loop-hd.mp4",
  },
  {
    name: "Art Lights",
    tag: "Loop Video",
    color: "from-black via-fuchsia-700 to-amber-200",
    videoUrl: "/media/backgrounds/easy-worship-background-art-lights.mp4",
  },
  {
    name: "Jonah Slide Loop",
    tag: "Loop Video",
    color: "from-slate-950 via-teal-700 to-sky-200",
    videoUrl: "/media/backgrounds/jonah-slide-loop-hq.mp4",
  },
  {
    name: "Flower Animation Loop",
    tag: "Loop Video",
    color: "from-green-950 via-emerald-500 to-pink-200",
    videoUrl: "/media/backgrounds/motion-graphics-after-effects-flower-animation-loop-free-video-download.mp4",
  },
  {
    name: "Smoke Moving Background",
    tag: "1080p Loop Video",
    color: "from-zinc-950 via-slate-600 to-zinc-200",
    videoUrl: "/media/backgrounds/smoke-moving-background-1080p.mp4",
  },
  {
    name: "Clouds Video Loop",
    tag: "Loop Video",
    color: "from-indigo-950 via-sky-500 to-slate-100",
    videoUrl: "/media/backgrounds/video-background-clouds-loop.mp4",
  },
  { name: "Aurora Chapel", tag: "Motion", color: "from-violet-500 via-sky-400 to-emerald-300" },
  { name: "Golden Dust", tag: "Video", color: "from-amber-300 via-rose-400 to-violet-600" },
  { name: "Calm Waters", tag: "Image", color: "from-cyan-300 via-blue-500 to-slate-950" },
  { name: "Midnight Cross", tag: "AI Pick", color: "from-zinc-950 via-violet-900 to-sky-500" },
  { name: "Soft Garden", tag: "Gradient", color: "from-emerald-300 via-teal-500 to-zinc-950" },
  { name: "Clouded Light", tag: "Favorite", color: "from-white via-sky-200 to-violet-700" },
];

export const slides = [
  { section: "Verse 1", text: "I love You, Lord / Oh Your mercy never fails me" },
  { section: "Chorus", text: "All my life You have been faithful / All my life You have been so good" },
  { section: "Bridge", text: "Your goodness is running after / It's running after me" },
  { section: "Outro", text: "With every breath that I am able / I will sing of the goodness of God" },
];

export const commandGroups = [
  {
    label: "Create",
    items: [
      { title: "New song presentation", meta: "Paste YouTube, split lyrics, design slides", icon: Wand2 },
      { title: "Generate Bible slides", meta: "Search John 3:16, Romans 8, Psalm 23", icon: BookOpen },
      { title: "Plan Sunday service", meta: "Songs, prayer, offering, sermon, announcements", icon: CalendarDays },
    ],
  },
  {
    label: "Search",
    items: [
      { title: "Goodness of God", meta: "Song by Bethel Music", icon: Music2 },
      { title: "Aurora Chapel", meta: "Motion background", icon: Palette },
      { title: "Sunday Worship Set", meta: "Service plan", icon: BadgeCheck },
      { title: "Favorite presentations", meta: "12 saved items", icon: Heart },
      { title: "Media library", meta: "Videos, images, motion loops", icon: Mic2 },
    ],
  },
];

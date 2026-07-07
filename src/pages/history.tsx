import { Copy, Edit3, Heart, Play, Trash2 } from "lucide-react";
import { Button } from "../components/button";
import { MagneticCard, Page } from "../components/motion";
import { recentSongs } from "../data/workspace";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export function HistoryPage() {
  const navigate = useNavigate();
  return (
    <Page className="px-4 py-6 md:px-8">
      <h2 className="mb-5 font-display text-4xl font-black">Presentation history</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[...recentSongs, ...recentSongs].map((song, index) => (
          <MagneticCard key={`${song.title}-${index}`} className="overflow-hidden">
            <div className="h-44 bg-gradient-to-br from-violet-700 via-sky-700 to-emerald-500" />
            <div className="p-5">
              <p className="font-semibold">{song.title}</p>
              <p className="text-sm text-zinc-500">{song.artist} · Alyssa · {120 + index * 8} views</p>
              <div className="mt-5 flex gap-2">
                <Button className="h-10 flex-1 px-0" onClick={() => navigate("/app/live")}><Play className="h-4 w-4" /></Button>
                <Button variant="secondary" className="h-10 w-10 px-0" onClick={() => toast.success("Favorited")}><Heart className="h-4 w-4" /></Button>
                <Button variant="secondary" className="h-10 w-10 px-0" onClick={() => toast.success("Duplicated")}><Copy className="h-4 w-4" /></Button>
                <Button variant="secondary" className="h-10 w-10 px-0" onClick={() => navigate("/app/builder")}><Edit3 className="h-4 w-4" /></Button>
                <Button variant="secondary" className="h-10 w-10 px-0" onClick={() => toast.error("Delete confirmation would open")}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          </MagneticCard>
        ))}
      </div>
    </Page>
  );
}

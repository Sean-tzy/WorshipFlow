import { CloudDownload, CloudUpload, Film, Image, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../components/button";
import { MagneticCard, Page } from "../components/motion";
import { backgrounds } from "../data/workspace";
import { api } from "../lib/api";
import toast from "react-hot-toast";

export function MediaPage() {
  const [items, setItems] = useState(backgrounds);

  useEffect(() => {
    void downloadPack(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const upload = async () => {
    const response = await api("/media/upload", { method: "POST", body: JSON.stringify({ file: "demo-motion.mp4" }) });
    toast.success(response.message);
  };

  const downloadPack = async (notify = true) => {
    const response = await api<{ backgrounds: typeof backgrounds }>("/media/background-pack", { method: "POST" });
    setItems((current) => {
      const names = new Set(current.map((item) => item.name));
      return [...current, ...response.data.backgrounds.filter((item) => !names.has(item.name))];
    });
    if (notify) toast.success(`${response.data.backgrounds.length} motion backgrounds added`);
  };

  return (
    <Page className="px-4 py-6 md:px-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-sm text-mint">Media Library</p><h2 className="font-display text-4xl font-black">Motion, video, image assets</h2></div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => downloadPack()}><CloudDownload className="h-4 w-4" /> Download pack</Button>
          <Button onClick={upload}><CloudUpload className="h-4 w-4" /> Upload</Button>
        </div>
      </div>
      <MagneticCard className="mb-4 border-dashed p-8 text-center">
        <CloudUpload className="mx-auto h-9 w-9 text-mint" />
        <p className="mt-4 font-display text-2xl font-bold">Drop MP4, MOV, PNG, JPG, GIF, or WEBP</p>
        <p className="mt-2 text-sm text-zinc-500">FFmpeg-ready metadata extraction and thumbnail generation.</p>
      </MagneticCard>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item, index) => (
          <button key={item.name} onClick={() => toast.success(`${item.name} selected`)} className="text-left">
          <MagneticCard className="overflow-hidden">
            <div className={`relative h-52 overflow-hidden bg-gradient-to-br ${item.color}`}>
              {"videoUrl" in item && item.videoUrl ? (
                <video className="absolute inset-0 h-full w-full object-cover" src={item.videoUrl} autoPlay muted loop playsInline />
              ) : null}
              <div className="absolute inset-0 bg-black/10" />
            </div>
            <div className="flex items-center justify-between p-5">
              <div>
                <p className="font-semibold">{item.name}</p>
                <p className="flex items-center gap-2 text-sm text-zinc-500">{index % 2 ? <Film className="h-4 w-4" /> : <Image className="h-4 w-4" />} {item.tag}</p>
              </div>
              <Star className="h-5 w-5 text-mint" />
            </div>
          </MagneticCard>
          </button>
        ))}
      </div>
    </Page>
  );
}

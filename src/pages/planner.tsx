import { GripVertical, Play, Plus } from "lucide-react";
import { Button } from "../components/button";
import { MagneticCard, Page } from "../components/motion";
import { api } from "../lib/api";
import toast from "react-hot-toast";

const plan = ["Countdown", "Welcome", "Song: Gratitude", "Song: Goodness of God", "Bible: Romans 8", "Offering", "Sermon Notes", "Closing"];

export function PlannerPage() {
  const saveOrder = async () => {
    const response = await api("/service-plans/reorder", { method: "POST", body: JSON.stringify({ items: plan }) });
    toast.success(response.message);
  };

  return (
    <Page className="px-4 py-6 md:px-8">
      <div className="mb-5 flex items-end justify-between">
        <div><p className="text-sm text-mint">Sunday Planner</p><h2 className="font-display text-4xl font-black">July 12 Service</h2></div>
        <Button onClick={saveOrder}><Play className="h-4 w-4" /> Present service</Button>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <MagneticCard className="p-5">
          <div className="space-y-3">
            {plan.map((item, index) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.04] p-4 hover:bg-white/[0.08]">
                <GripVertical className="h-5 w-5 text-zinc-600" />
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/[0.06] text-sm text-zinc-400">{index + 1}</span>
                <span className="flex-1 font-medium">{item}</span>
                <span className="text-sm text-zinc-500">{index % 2 ? "04:00" : "02:30"}</span>
              </div>
            ))}
          </div>
        </MagneticCard>
        <MagneticCard className="p-5">
          <h3 className="font-display text-2xl font-bold">Add item</h3>
          <div className="mt-5 grid gap-3">
            {["Song", "Bible", "Announcement", "Video", "Prayer", "Communion", "Offering", "Custom"].map((item) => (
              <button key={item} onClick={() => toast.success(`${item} added to plan`)} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.04] p-3 text-left hover:bg-white/[0.08]">
                <Plus className="h-4 w-4 text-mint" /> {item}
              </button>
            ))}
          </div>
        </MagneticCard>
      </div>
    </Page>
  );
}

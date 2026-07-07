import { Keyboard, MonitorCog, Palette, Users } from "lucide-react";
import { Button } from "../components/button";
import { MagneticCard, Page } from "../components/motion";
import { api } from "../lib/api";
import toast from "react-hot-toast";

export function SettingsPage() {
  const save = async () => {
    const response = await api("/settings", {
      method: "PUT",
      body: JSON.stringify({ church_name: "City Harvest Church Villamonte" }),
    });
    toast.success(response.message);
  };

  const groups = [
    { title: "Church identity", icon: Palette, fields: ["Church name", "Logo", "Theme", "Fonts"] },
    { title: "Presentation", icon: MonitorCog, fields: ["Resolution", "OBS output", "Language", "High contrast"] },
    { title: "Team", icon: Users, fields: ["Members", "Roles", "Invites", "Billing"] },
    { title: "Shortcuts", icon: Keyboard, fields: ["Command palette", "Next slide", "Black screen", "Undo"] },
  ];
  return (
    <Page className="px-4 py-6 md:px-8">
      <h2 className="mb-5 font-display text-4xl font-black">Settings</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {groups.map((group) => (
          <MagneticCard key={group.title} className="p-5">
            <group.icon className="mb-5 h-6 w-6 text-mint" />
            <h3 className="font-display text-2xl font-bold">{group.title}</h3>
            <div className="mt-5 space-y-3">
              {group.fields.map((field) => (
                <label key={field} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.04] p-3">
                  <span className="text-sm text-zinc-300">{field}</span>
                  <input className="max-w-[160px] bg-transparent text-right text-sm outline-none placeholder:text-zinc-600" placeholder="Configure" />
                </label>
              ))}
            </div>
          </MagneticCard>
        ))}
      </div>
      <Button className="mt-5" onClick={save}>Save settings</Button>
    </Page>
  );
}

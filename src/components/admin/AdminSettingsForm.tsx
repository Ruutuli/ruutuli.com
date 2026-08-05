"use client";

import { useState } from "react";
import { SiteSettings } from "@/types/settings";
import {
  AdminButton,
  AdminCard,
  AdminField,
  AdminPageHeader,
  AdminTextarea,
  AdminToast,
} from "./ui";

const FIELDS: { key: keyof SiteSettings; label: string; multiline?: boolean }[] = [
  { key: "name", label: "Site name" },
  { key: "displayName", label: "Display name" },
  { key: "tagline", label: "Tagline" },
  { key: "roles", label: "Roles", multiline: true },
  { key: "bio", label: "Bio", multiline: true },
  { key: "contactEmail", label: "Contact email" },
];

export default function AdminSettingsForm({ initial }: { initial: SiteSettings }) {
  const [settings, setSettings] = useState(initial);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    const snapshot = settings;
    setMessage("Settings saved");

    const slowTimer = window.setTimeout(() => setSaving(true), 400);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("save failed");
      setSettings(await res.json());
    } catch {
      setSettings(snapshot);
      setMessage("Could not save settings");
    } finally {
      window.clearTimeout(slowTimer);
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <AdminPageHeader title="Site settings" description="Text and copy shown on the public site." />

      <AdminCard className="divide-y divide-closet-pink/35">
        <div className="space-y-5 p-6">
          {FIELDS.map(({ key, label, multiline }) =>
            multiline ? (
              <AdminTextarea
                key={key}
                label={label}
                value={settings[key] as string}
                onChange={(v) => setSettings({ ...settings, [key]: v })}
                rows={key === "bio" ? 4 : 3}
              />
            ) : (
              <AdminField
                key={key}
                label={label}
                value={settings[key] as string}
                onChange={(v) => setSettings({ ...settings, [key]: v })}
              />
            ),
          )}
          <AdminField
            label="Instagram URL"
            value={settings.socials.instagram}
            onChange={(v) => setSettings({ ...settings, socials: { ...settings.socials, instagram: v } })}
          />
          <AdminField
            label="TikTok URL"
            value={settings.socials.tiktok}
            onChange={(v) => setSettings({ ...settings, socials: { ...settings.socials, tiktok: v } })}
          />
          <AdminField
            label="Twitch URL"
            value={settings.socials.twitch}
            onChange={(v) => setSettings({ ...settings, socials: { ...settings.socials, twitch: v } })}
          />
          <AdminField
            label="X / Twitter URL"
            value={settings.socials.twitter}
            onChange={(v) => setSettings({ ...settings, socials: { ...settings.socials, twitter: v } })}
          />
        </div>
        <div className="flex items-center justify-between gap-4 bg-closet-blush/20 px-6 py-4">
          <p className="text-xs text-closet-brown-light">Changes appear on the site after saving.</p>
          <AdminButton variant="primary" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save settings"}
          </AdminButton>
        </div>
      </AdminCard>

      <AdminToast message={message} onDone={() => setMessage("")} />
    </div>
  );
}

import { useEffect, useState } from "react";
import { defineWidgetConfig } from "@medusajs/admin-sdk";
import "./perfume-details-widget.css";
import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Label,
  Select,
  Switch,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui";

type Concentration = "EDT" | "EDP" | "PARFUM";
type Family = "floral" | "woody" | "oriental" | "fresh" | "gourmand";
type Gender = "feminine" | "masculine" | "unisex";
type Intensity = "light" | "moderate" | "strong";

interface PerfumeDetailsState {
  concentration: Concentration;
  family: Family;
  gender: Gender;
  intensity: Intensity;
  notes_top: string[];
  notes_heart: string[];
  notes_base: string[];
  perfumer: string;
  story: string;
  is_limited: boolean;
  sample_eligible: boolean;
}

const DEFAULTS: PerfumeDetailsState = {
  concentration: "EDP",
  family: "floral",
  gender: "unisex",
  intensity: "moderate",
  notes_top: [],
  notes_heart: [],
  notes_base: [],
  perfumer: "",
  story: "",
  is_limited: false,
  sample_eligible: false,
};

const PYRAMID_LAYERS: { key: "notes_top" | "notes_heart" | "notes_base"; label: string; sub: string; className: string }[] = [
  { key: "notes_top", label: "Top", sub: "First impression · 0–30 min", className: "ley-pyramid-top" },
  { key: "notes_heart", label: "Heart", sub: "The character · 30 min–6 hr", className: "ley-pyramid-heart" },
  { key: "notes_base", label: "Base", sub: "The dry-down · 6 hr+", className: "ley-pyramid-base" },
];

function NoteLayer({
  label,
  sub,
  className,
  notes,
  onAdd,
  onRemove,
}: {
  label: string;
  sub: string;
  className: string;
  notes: string[];
  onAdd: (note: string) => void;
  onRemove: (note: string) => void;
}) {
  const [draft, setDraft] = useState("");

  function submit() {
    const value = draft.trim();
    if (!value) return;
    onAdd(value);
    setDraft("");
  }

  return (
    <div className={`ley-pyramid-layer ${className}`}>
      <div className="ley-pyramid-layer-header">
        <Text weight="plus" size="small">{label} notes</Text>
        <Text size="xsmall" className="ley-pyramid-sub">{sub}</Text>
      </div>
      <div className="ley-pyramid-chips">
        {notes.length === 0 && (
          <Text size="xsmall" className="ley-pyramid-empty">No notes yet</Text>
        )}
        {notes.map((note) => (
          <Badge key={note} size="small" className="ley-chip">
            {note}
            <button type="button" onClick={() => onRemove(note)} className="ley-chip-remove" aria-label={`Remove ${note}`}>
              ×
            </button>
          </Badge>
        ))}
      </div>
      <div className="ley-pyramid-add">
        <Input
          size="small"
          placeholder={`Add a ${label.toLowerCase()} note…`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
        />
        <Button size="small" variant="secondary" type="button" onClick={submit}>
          Add
        </Button>
      </div>
    </div>
  );
}

// A minimal local stand-in for @medusajs/types' DetailWidgetProps<AdminProduct> —
// this widget only ever reads the product's id, so it doesn't need that
// package's full (and, in this workspace, awkward to resolve as a
// standalone dependency) type surface.
interface ProductDetailWidgetProps {
  data: { id: string };
}

const PerfumeDetailsWidget = ({ data }: ProductDetailWidgetProps) => {
  const [state, setState] = useState<PerfumeDetailsState>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/admin/perfume-details?product_id=${data.id}`, { credentials: "include" })
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (json.perfume_details) {
          setState({ ...DEFAULTS, ...json.perfume_details, perfumer: json.perfume_details.perfumer ?? "", story: json.perfume_details.story ?? "" });
        }
      })
      .catch(() => toast.error("Could not load the fragrance profile."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [data.id]);

  function update<K extends keyof PerfumeDetailsState>(key: K, value: PerfumeDetailsState[K]) {
    setState((prev) => ({ ...prev, [key]: value }));
  }

  function addNote(key: "notes_top" | "notes_heart" | "notes_base", note: string) {
    if (state[key].includes(note)) return;
    update(key, [...state[key], note]);
  }

  function removeNote(key: "notes_top" | "notes_heart" | "notes_base", note: string) {
    update(key, state[key].filter((n) => n !== note));
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/admin/perfume-details", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: data.id, ...state }),
      });
      if (!res.ok) throw new Error();
      toast.success("Fragrance profile saved.");
    } catch {
      toast.error("Could not save the fragrance profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Text size="small" className="text-ui-fg-subtle">Loading fragrance profile…</Text>
        </div>
      </Container>
    );
  }

  return (
    <Container className="ley-widget divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Fragrance Profile</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            The scent pyramid and details shown on the storefront product page.
          </Text>
        </div>
        <Button size="small" onClick={save} isLoading={saving}>
          Save
        </Button>
      </div>

      <div className="ley-pyramid px-6 py-6">
        {PYRAMID_LAYERS.map((layer) => (
          <NoteLayer
            key={layer.key}
            label={layer.label}
            sub={layer.sub}
            className={layer.className}
            notes={state[layer.key]}
            onAdd={(note) => addNote(layer.key, note)}
            onRemove={(note) => removeNote(layer.key, note)}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-4 px-6 py-6 md:grid-cols-4">
        <div>
          <Label size="small">Concentration</Label>
          <Select value={state.concentration} onValueChange={(v) => update("concentration", v as Concentration)}>
            <Select.Trigger className="mt-1"><Select.Value /></Select.Trigger>
            <Select.Content>
              <Select.Item value="EDT">Eau de Toilette</Select.Item>
              <Select.Item value="EDP">Eau de Parfum</Select.Item>
              <Select.Item value="PARFUM">Parfum</Select.Item>
            </Select.Content>
          </Select>
        </div>
        <div>
          <Label size="small">Family</Label>
          <Select value={state.family} onValueChange={(v) => update("family", v as Family)}>
            <Select.Trigger className="mt-1"><Select.Value /></Select.Trigger>
            <Select.Content>
              <Select.Item value="floral">Floral</Select.Item>
              <Select.Item value="woody">Woody</Select.Item>
              <Select.Item value="oriental">Oriental</Select.Item>
              <Select.Item value="fresh">Fresh</Select.Item>
              <Select.Item value="gourmand">Gourmand</Select.Item>
            </Select.Content>
          </Select>
        </div>
        <div>
          <Label size="small">Gender</Label>
          <Select value={state.gender} onValueChange={(v) => update("gender", v as Gender)}>
            <Select.Trigger className="mt-1"><Select.Value /></Select.Trigger>
            <Select.Content>
              <Select.Item value="feminine">Feminine</Select.Item>
              <Select.Item value="masculine">Masculine</Select.Item>
              <Select.Item value="unisex">Unisex</Select.Item>
            </Select.Content>
          </Select>
        </div>
        <div>
          <Label size="small">Intensity</Label>
          <Select value={state.intensity} onValueChange={(v) => update("intensity", v as Intensity)}>
            <Select.Trigger className="mt-1"><Select.Value /></Select.Trigger>
            <Select.Content>
              <Select.Item value="light">Light</Select.Item>
              <Select.Item value="moderate">Moderate</Select.Item>
              <Select.Item value="strong">Strong</Select.Item>
            </Select.Content>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 px-6 py-6 md:grid-cols-2">
        <div>
          <Label size="small">Perfumer</Label>
          <Input
            className="mt-1"
            placeholder="e.g. Henri de Valois"
            value={state.perfumer}
            onChange={(e) => update("perfumer", e.target.value)}
          />
        </div>
        <div className="flex items-end gap-6">
          <div className="flex items-center gap-2">
            <Switch checked={state.is_limited} onCheckedChange={(v) => update("is_limited", v)} id="ley-limited" />
            <Label size="small" htmlFor="ley-limited">Limited edition</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={state.sample_eligible} onCheckedChange={(v) => update("sample_eligible", v)} id="ley-sample" />
            <Label size="small" htmlFor="ley-sample">Sample eligible</Label>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        <Label size="small">Story</Label>
        <Textarea
          className="mt-1"
          rows={3}
          placeholder="The narrative shown on the product page…"
          value={state.story}
          onChange={(e) => update("story", e.target.value)}
        />
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.after",
});

export default PerfumeDetailsWidget;

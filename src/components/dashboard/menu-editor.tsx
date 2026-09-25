"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, ImagePlus, Eye, EyeOff, X } from "lucide-react";
import type { MenuItemWithOptions, MenuSection } from "@/lib/services/catalog";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea, Select, Checkbox, EmptyState } from "@/components/ui/primitives";
import { Modal } from "@/components/ui/modal";
import { DishImage } from "@/components/ui/dish-image";
import { formatMoney, parseMoneyInput } from "@/lib/money";
import { api, ApiError } from "@/lib/api-client";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";

const TAGS = ["vegan", "vegetarian", "gluten-free", "alcohol", "contains-nuts", "halal"] as const;

interface GroupDraft {
  id?: string;
  name: string;
  min_select: number;
  max_select: number;
  modifiers: { id?: string; name: string; price: string; is_available: boolean; is_default: boolean }[];
}
interface ItemDraft {
  id?: string;
  category_id: string;
  name: string;
  description: string;
  price: string;
  image_url: string;
  is_available: boolean;
  is_featured: boolean;
  dietary_tags: string[];
  spice_level: number;
  groups: GroupDraft[];
}

function toDraft(item: MenuItemWithOptions): ItemDraft {
  return {
    id: item.id,
    category_id: item.category_id,
    name: item.name,
    description: item.description ?? "",
    price: (item.price_cents / 100).toString(),
    image_url: item.image_url ?? "",
    is_available: item.is_available,
    is_featured: item.is_featured,
    dietary_tags: item.dietary_tags,
    spice_level: item.spice_level,
    groups: item.groups.map((g) => ({
      id: g.id,
      name: g.name,
      min_select: g.min_select,
      max_select: g.max_select,
      modifiers: g.modifiers.map((m) => ({ id: m.id, name: m.name, price: (m.price_delta_cents / 100).toString(), is_available: m.is_available, is_default: m.is_default })),
    })),
  };
}

export function MenuEditor({ restaurantId, currency, sections }: { restaurantId: string; currency: string; sections: MenuSection[] }) {
  const router = useRouter();
  const base = `/api/v1/partner/${restaurantId}`;
  const [item, setItem] = useState<ItemDraft | null>(null);
  const [cat, setCat] = useState<null | { id?: string; name: string; description: string; is_active: boolean; available_from: string; available_until: string }>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function call(url: string, method: string, body?: unknown, success?: string) {
    try {
      await api(url, { method, body });
      if (success) toast.success(success);
      router.refresh();
      return true;
    } catch (e) {
      if (e instanceof ApiError && e.fields) setErrors(e.fields);
      toast.error((e as Error).message);
      return false;
    }
  }

  async function saveItem() {
    if (!item) return;
    const price = parseMoneyInput(item.price);
    if (price === null) return setErrors({ price_cents: "Enter a valid price" });
    const modifier_groups = item.groups.map((g) => ({
      id: g.id,
      name: g.name,
      min_select: g.min_select,
      max_select: g.max_select,
      modifiers: g.modifiers.map((m) => ({ id: m.id, name: m.name, price_delta_cents: parseMoneyInput(m.price || "0") ?? 0, is_available: m.is_available, is_default: m.is_default })),
    }));
    const body = {
      category_id: item.category_id,
      name: item.name,
      description: item.description || null,
      price_cents: price,
      image_url: item.image_url || null,
      is_available: item.is_available,
      is_featured: item.is_featured,
      dietary_tags: item.dietary_tags,
      spice_level: item.spice_level,
      modifier_groups,
    };
    setBusy(true);
    const ok = await call(item.id ? `${base}/items/${item.id}` : `${base}/items`, item.id ? "PATCH" : "POST", body, "Item saved");
    setBusy(false);
    if (ok) setItem(null);
  }

  async function saveCategory() {
    if (!cat) return;
    setBusy(true);
    const body = { name: cat.name, description: cat.description || null, is_active: cat.is_active, available_from: cat.available_from || null, available_until: cat.available_until || null };
    const ok = await call(cat.id ? `${base}/categories/${cat.id}` : `${base}/categories`, cat.id ? "PATCH" : "POST", body, "Category saved");
    setBusy(false);
    if (ok) setCat(null);
  }

  async function upload(file: File) {
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch(`${base}/upload`, { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Upload failed");
      setItem((i) => (i ? { ...i, image_url: json.url } : i));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function move(section: MenuSection, index: number, dir: -1 | 1) {
    const list = [...section.items];
    const j = index + dir;
    if (j < 0 || j >= list.length) return;
    [list[index], list[j]] = [list[j], list[index]];
    Promise.all(list.map((it, k) => (it.sort_order !== k ? api(`${base}/items/${it.id}`, { method: "PATCH", body: { sort_order: k } }) : null))).then(() => router.refresh());
  }
  function moveCategory(index: number, dir: -1 | 1) {
    const list = [...sections];
    const j = index + dir;
    if (j < 0 || j >= list.length) return;
    [list[index], list[j]] = [list[j], list[index]];
    Promise.all(list.map((c, k) => (c.sort_order !== k ? api(`${base}/categories/${c.id}`, { method: "PATCH", body: { sort_order: k } }) : null))).then(() => router.refresh());
  }

  const newItem = (categoryId: string): ItemDraft => ({ category_id: categoryId, name: "", description: "", price: "", image_url: "", is_available: true, is_featured: false, dietary_tags: [], spice_level: 0, groups: [] });

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => { setErrors({}); setCat({ name: "", description: "", is_active: true, available_from: "", available_until: "" }); }}>
          <Plus className="size-4" /> Add category
        </Button>
        {sections.length > 0 && (
          <Button size="sm" variant="secondary" onClick={() => { setErrors({}); setItem(newItem(sections[0].id)); }}>
            <Plus className="size-4" /> Add item
          </Button>
        )}
      </div>
      {sections.length === 0 && <EmptyState title="Your menu is empty">Start by adding a category such as “Main Courses”, then add items to it.</EmptyState>}
      <div className="space-y-6">
        {sections.map((s, si) => (
          <section key={s.id} className={cn("card overflow-hidden", !s.is_active && "opacity-70")}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cream-200 bg-cream-50 px-5 py-3">
              <div>
                <h2 className="font-sans text-lg font-bold">
                  {s.name} <span className="text-sm font-normal text-night-600">· {s.items.length} items</span>
                  {!s.is_active && <span className="ml-2 rounded-full bg-cream-200 px-2 py-0.5 text-xs">Hidden</span>}
                </h2>
                {s.available_from && <p className="text-xs text-night-600">Served {s.available_from}–{s.available_until}</p>}
              </div>
              <div className="flex items-center gap-1">
                <IconBtn label="Move category up" onClick={() => moveCategory(si, -1)} disabled={si === 0}><ChevronUp className="size-4" /></IconBtn>
                <IconBtn label="Move category down" onClick={() => moveCategory(si, 1)} disabled={si === sections.length - 1}><ChevronDown className="size-4" /></IconBtn>
                <IconBtn label="Edit category" onClick={() => { setErrors({}); setCat({ id: s.id, name: s.name, description: s.description ?? "", is_active: s.is_active, available_from: s.available_from ?? "", available_until: s.available_until ?? "" }); }}><Pencil className="size-4" /></IconBtn>
                <IconBtn label="Delete category" onClick={() => confirm(`Delete “${s.name}”? It must be empty.`) && call(`${base}/categories/${s.id}`, "DELETE", undefined, "Category deleted")}><Trash2 className="size-4" /></IconBtn>
                <Button size="sm" variant="secondary" onClick={() => { setErrors({}); setItem(newItem(s.id)); }}><Plus className="size-4" /> Item</Button>
              </div>
            </div>
            {s.items.length === 0 ? <p className="px-5 py-4 text-sm text-night-600">No items yet.</p> : (
              <ul className="divide-y divide-cream-200">
                {s.items.map((it, ii) => (
                  <li key={it.id} className="flex items-center gap-3 px-5 py-3">
                    <DishImage name={it.name} imageUrl={it.image_url} category={s.name} className="size-12 shrink-0 rounded-lg" sizes="48px" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{it.name} {it.is_featured && <span className="ml-1 rounded-full bg-gold-300/40 px-2 py-0.5 text-[0.65rem] font-bold text-gold-600">Featured</span>}</p>
                      <p className="text-xs text-night-600">{formatMoney(it.price_cents, currency)}{it.groups.length > 0 && ` · ${it.groups.length} option group${it.groups.length > 1 ? "s" : ""}`}</p>
                    </div>
                    <button
                      onClick={() => call(`${base}/items/${it.id}`, "PATCH", { is_available: !it.is_available }, it.is_available ? `${it.name} marked sold out` : `${it.name} available`)}
                      className={cn("inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-bold", it.is_available ? "bg-leaf-50 text-leaf-700" : "bg-night-900 text-cream-50")}
                    >
                      {it.is_available ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />} {it.is_available ? "Available" : "Sold out"}
                    </button>
                    <div className="hidden items-center sm:flex">
                      <IconBtn label="Move up" onClick={() => move(s, ii, -1)} disabled={ii === 0}><ChevronUp className="size-4" /></IconBtn>
                      <IconBtn label="Move down" onClick={() => move(s, ii, 1)} disabled={ii === s.items.length - 1}><ChevronDown className="size-4" /></IconBtn>
                    </div>
                    <IconBtn label={`Edit ${it.name}`} onClick={() => { setErrors({}); setItem(toDraft(it)); }}><Pencil className="size-4" /></IconBtn>
                    <IconBtn label={`Delete ${it.name}`} onClick={() => confirm(`Delete “${it.name}”?`) && call(`${base}/items/${it.id}`, "DELETE", undefined, "Item deleted")}><Trash2 className="size-4" /></IconBtn>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      <Modal open={Boolean(cat)} onClose={() => setCat(null)} title={cat?.id ? "Edit category" : "New category"} footer={<Button className="w-full" loading={busy} onClick={saveCategory}>Save category</Button>}>
        {cat && (
          <div className="space-y-4 p-5">
            <Field label="Name" htmlFor="cat-name" error={errors.name}><Input id="cat-name" value={cat.name} onChange={(e) => setCat({ ...cat, name: e.target.value })} placeholder="e.g. Main Courses" /></Field>
            <Field label="Description" htmlFor="cat-desc"><Input id="cat-desc" value={cat.description} onChange={(e) => setCat({ ...cat, description: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Served from (optional)" htmlFor="cat-from" error={errors.available_from} hint="e.g. 07:00 for breakfast"><Input id="cat-from" type="time" value={cat.available_from} onChange={(e) => setCat({ ...cat, available_from: e.target.value })} /></Field>
              <Field label="Served until" htmlFor="cat-until" error={errors.available_until}><Input id="cat-until" type="time" value={cat.available_until} onChange={(e) => setCat({ ...cat, available_until: e.target.value })} /></Field>
            </div>
            <Checkbox label="Visible on the menu" checked={cat.is_active} onChange={(e) => setCat({ ...cat, is_active: e.target.checked })} />
          </div>
        )}
      </Modal>

      <Modal wide open={Boolean(item)} onClose={() => setItem(null)} title={item?.id ? "Edit item" : "New item"} footer={<Button className="w-full" loading={busy} onClick={saveItem}>Save item</Button>}>
        {item && (
          <div className="grid gap-5 p-5 md:grid-cols-[200px_1fr]">
            <div>
              <DishImage name={item.name || "New dish"} imageUrl={item.image_url || null} className="aspect-square rounded-2xl" />
              <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-full border border-cream-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-cream-100">
                <ImagePlus className="size-4" /> {uploading ? "Uploading…" : "Upload photo"}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
              </label>
              {item.image_url && <button className="mt-2 w-full text-xs text-night-600 underline" onClick={() => setItem({ ...item, image_url: "" })}>Remove photo</button>}
            </div>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
                <Field label="Name" htmlFor="it-name" error={errors.name}><Input id="it-name" value={item.name} onChange={(e) => setItem({ ...item, name: e.target.value })} /></Field>
                <Field label={`Price (${currency})`} htmlFor="it-price" error={errors.price_cents}><Input id="it-price" inputMode="decimal" value={item.price} onChange={(e) => setItem({ ...item, price: e.target.value })} placeholder="1950" /></Field>
              </div>
              <Field label="Description" htmlFor="it-desc"><Textarea id="it-desc" value={item.description} onChange={(e) => setItem({ ...item, description: e.target.value })} /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Category" htmlFor="it-cat">
                  <Select id="it-cat" value={item.category_id} onChange={(e) => setItem({ ...item, category_id: e.target.value })}>
                    {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </Select>
                </Field>
                <Field label="Spice level" htmlFor="it-spice">
                  <Select id="it-spice" value={item.spice_level} onChange={(e) => setItem({ ...item, spice_level: Number(e.target.value) })}>
                    {["None", "Mild", "Medium", "Hot"].map((l, i) => <option key={l} value={i}>{l}</option>)}
                  </Select>
                </Field>
              </div>
              <div className="flex flex-wrap gap-2">
                {TAGS.map((t) => {
                  const on = item.dietary_tags.includes(t);
                  return (
                    <button type="button" key={t} aria-pressed={on} onClick={() => setItem({ ...item, dietary_tags: on ? item.dietary_tags.filter((x) => x !== t) : [...item.dietary_tags, t] })} className={cn("rounded-full px-3 py-1 text-xs font-bold capitalize ring-1", on ? "bg-night-900 text-cream-50 ring-night-900" : "bg-white ring-cream-300")}>
                      {t.replace("-", " ")}
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-6">
                <Checkbox label="Available" checked={item.is_available} onChange={(e) => setItem({ ...item, is_available: e.target.checked })} />
                <Checkbox label="Featured / popular" checked={item.is_featured} onChange={(e) => setItem({ ...item, is_featured: e.target.checked })} />
              </div>

              <div className="border-t border-cream-200 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-sans font-bold">Options & add-ons</h3>
                  <Button size="sm" variant="secondary" onClick={() => setItem({ ...item, groups: [...item.groups, { name: "", min_select: 0, max_select: 1, modifiers: [{ name: "", price: "0", is_available: true, is_default: false }] }] })}>
                    <Plus className="size-4" /> Group
                  </Button>
                </div>
                <p className="mt-1 text-xs text-night-600">E.g. “Choose your side” (min 1, max 1) or “Add-ons” (min 0, max 5).</p>
                {item.groups.map((g, gi) => {
                  const setG = (patch: Partial<GroupDraft>) => setItem({ ...item, groups: item.groups.map((x, k) => (k === gi ? { ...x, ...patch } : x)) });
                  return (
                    <div key={gi} className="mt-3 rounded-2xl border border-cream-200 bg-cream-50 p-4">
                      <div className="flex items-end gap-2">
                        <Field label="Group name" htmlFor={`g-${gi}`} className="flex-1"><Input id={`g-${gi}`} value={g.name} onChange={(e) => setG({ name: e.target.value })} /></Field>
                        <Field label="Min" htmlFor={`gmin-${gi}`} className="w-20"><Input id={`gmin-${gi}`} type="number" min={0} value={g.min_select} onChange={(e) => setG({ min_select: Number(e.target.value) })} /></Field>
                        <Field label="Max" htmlFor={`gmax-${gi}`} className="w-20"><Input id={`gmax-${gi}`} type="number" min={0} value={g.max_select} onChange={(e) => setG({ max_select: Number(e.target.value) })} /></Field>
                        <IconBtn label="Remove group" onClick={() => setItem({ ...item, groups: item.groups.filter((_, k) => k !== gi) })}><X className="size-4" /></IconBtn>
                      </div>
                      <ul className="mt-3 space-y-2">
                        {g.modifiers.map((m, mi) => {
                          const setM = (patch: Partial<GroupDraft["modifiers"][number]>) => setG({ modifiers: g.modifiers.map((x, k) => (k === mi ? { ...x, ...patch } : x)) });
                          return (
                            <li key={mi} className="flex flex-wrap items-center gap-2">
                              <Input aria-label="Option name" placeholder="Option" value={m.name} onChange={(e) => setM({ name: e.target.value })} className="min-w-40 flex-1 py-2" />
                              <Input aria-label="Extra price" inputMode="decimal" placeholder="+0" value={m.price} onChange={(e) => setM({ price: e.target.value })} className="w-24 py-2" />
                              <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={m.is_default} onChange={(e) => setM({ is_default: e.target.checked })} className="accent-ember-500" /> Default</label>
                              <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={m.is_available} onChange={(e) => setM({ is_available: e.target.checked })} className="accent-ember-500" /> Available</label>
                              <IconBtn label="Remove option" onClick={() => setG({ modifiers: g.modifiers.filter((_, k) => k !== mi) })}><X className="size-4" /></IconBtn>
                            </li>
                          );
                        })}
                      </ul>
                      <button className="mt-2 text-sm font-semibold text-ember-600" onClick={() => setG({ modifiers: [...g.modifiers, { name: "", price: "0", is_available: true, is_default: false }] })}>+ Add option</button>
                    </div>
                  );
                })}
                {Object.keys(errors).some((k) => k.startsWith("modifier_groups")) && <p className="mt-2 text-sm text-ember-700">Check your option groups — every group and option needs a name.</p>}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function IconBtn({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label} title={label} className="grid size-8 place-items-center rounded-full text-night-600 hover:bg-cream-200 disabled:opacity-30">
      {children}
    </button>
  );
}

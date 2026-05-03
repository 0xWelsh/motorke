"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronRight, Info } from "lucide-react";
import MediaUploader from "./admin/MediaUploader";
import {
  BODY_TYPE_LABELS,
  DRIVETRAIN_LABELS,
  FUEL_LABELS,
  HYBRID_BATTERY_LABELS,
  STEERING_LABELS,
  TRANSMISSION_LABELS,
} from "@/lib/utils";

const MAKES = [
  "Abarth",
  "Acura",
  "Aion",
  "Aiways",
  "Alfa Romeo",
  "Alpine",
  "Aston Martin",
  "Audi",
  "BAIC",
  "Bentley",
  "Bestune",
  "BMW",
  "Borgward",
  "Brilliance",
  "Bugatti",
  "Buick",
  "BYD",
  "Cadillac",
  "Changan",
  "Changhe",
  "Chery",
  "Chevrolet",
  "Chrysler",
  "Citroen",
  "Cupra",
  "Dacia",
  "Daewoo",
  "Daihatsu",
  "Datsun",
  "Denza",
  "DFSK",
  "Dodge",
  "Dongfeng",
  "DS",
  "FAW",
  "Ferrari",
  "Fiat",
  "Fisker",
  "Ford",
  "Foton",
  "Fuso",
  "GAC",
  "Geely",
  "Genesis",
  "GMC",
  "Great Wall",
  "Haval",
  "Hino",
  "Honda",
  "Hongqi",
  "Hummer",
  "Hyundai",
  "IM Motors",
  "Infiniti",
  "Isuzu",
  "JAC",
  "Jaecoo",
  "Jaguar",
  "Jeep",
  "Jetour",
  "JMC",
  "Kia",
  "Koenigsegg",
  "Lada",
  "Lamborghini",
  "Lancia",
  "Land Rover",
  "Leapmotor",
  "Lexus",
  "Lincoln",
  "Lotus",
  "Lucid",
  "Lynk & Co",
  "Mahindra",
  "MAN",
  "Maserati",
  "Maxus",
  "Maybach",
  "Mazda",
  "McLaren",
  "Mercedes-Benz",
  "Mercury",
  "MG",
  "Mini",
  "Mitsubishi",
  "Neta",
  "Nio",
  "Nissan",
  "Oldsmobile",
  "Omoda",
  "Opel",
  "ORA",
  "Other",
  "Pagani",
  "Peugeot",
  "Polestar",
  "Pontiac",
  "Porsche",
  "Proton",
  "RAM",
  "Range Rover",
  "Renault",
  "Rivian",
  "Rolls-Royce",
  "Rover",
  "Saab",
  "Saturn",
  "Scania",
  "SEAT",
  "Skoda",
  "Smart",
  "SsangYong",
  "Subaru",
  "Suzuki",
  "Tata",
  "Tesla",
  "Toyota",
  "Triumph",
  "Vauxhall",
  "VinFast",
  "Volkswagen",
  "Volvo",
  "Wuling",
  "XPeng",
  "Zeekr",
  "Zotye",
].sort((a, b) => a.localeCompare(b));

const CONDITIONS = [
  { value: "USED", label: "Used" },
  { value: "NEW", label: "New" },
  { value: "CERTIFIED", label: "Certified" },
];

/**
 * Parses price for the API: strips commas / spaces / KSh / KES; supports 3.25M-style millions
 * using exact integer math (no float rounding).
 */
function parsePriceInputToKesInt(raw) {
  let s = String(raw ?? "").trim();
  if (!s) return NaN;
  s = s.replace(/,/g, "").replace(/\s+/g, "");
  s = s.replace(/^ksh/i, "").replace(/^kes/i, "").trim();
  const mSuffix = s.match(/^([\d.]+)\s*[mM]$/);
  if (mSuffix) {
    const core = mSuffix[1];
    const [wholeRaw, fracRaw = ""] = core.split(".");
    const wholeDigits = (wholeRaw || "").replace(/[^\d]/g, "") || "0";
    const fracDigits = (fracRaw || "").replace(/[^\d]/g, "");
    const w = BigInt(wholeDigits);
    if (!fracDigits) return Number(w * 1_000_000n);
    const f = BigInt(fracDigits);
    const len = BigInt(fracDigits.length);
    return Number(w * 1_000_000n + (f * 1_000_000n) / 10n ** len);
  }
  const digits = s.replace(/[^\d]/g, "");
  if (!digits) return NaN;
  const n = parseInt(digits, 10);
  return Number.isFinite(n) ? n : NaN;
}

function collectFormSnapshot(form) {
  if (!form) return {};
  return collectFormValues(form);
}

/** "A, B,  C" -> ["A","B","C"] */
function parseCommaFeatures(raw) {
  return String(raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}


function buildBaseSeed(car, currentYear) {
  return {
    dealerId: car?.dealerId || "",
    make: car?.make || "",
    model: car?.model || "",
    variant: car?.variant || "",
    year: car?.year || currentYear,
    condition: car?.condition || "USED",
    price: car?.price || "",
    mileage: car?.mileage || "",
    fuelType: car?.fuelType || "PETROL",
    transmission: car?.transmission || "AUTOMATIC",
    bodyType: car?.bodyType || "SEDAN",
    engineCC: car?.engineCC || "",
    groundClearanceMm: car?.groundClearanceMm || "",
    hybridBatteryTech: car?.hybridBatteryTech || "NA",
    spareAvailability: car?.spareAvailability || "",
    cylinders: car?.cylinders || "",
    horsepower: car?.horsepower || "",
    torque: car?.torque || "",
    drivetrain: car?.drivetrain ?? "",
    steering: car?.steering || "RHD",
    airbags: car?.airbags || "",
    seats: car?.seats || "",
    color: car?.color || "",
    description: car?.description || "",
    negotiable: car?.negotiable ?? true,
    imported: car?.imported ?? true,
    registered: car?.registered ?? true,
    turbo: car?.turbo ?? false,
    sunroof: car?.sunroof ?? false,
    featured: car?.featured ?? false,
  };
}

function collectFormValues(form) {
  const values = {};
  const fields = form.querySelectorAll("input[name], select[name], textarea[name]");

  fields.forEach((field) => {
    if (field.type === "file") return;
    if (field.type === "checkbox") values[field.name] = field.checked;
    else values[field.name] = field.value;
  });

  return values;
}

function buildAutoDescription(values = {}, features = []) {
  const bits = [];
  const year = values.year || "";
  const make = values.make || "";
  const model = values.model || "";
  const variant = values.variant || "";
  const title = [year, make, model, variant].filter(Boolean).join(" ").trim();
  if (title) bits.push(`${title} is available and ready for viewing.`);

  const specLine = [
    values.transmission ? `${values.transmission.toLowerCase()} transmission` : "",
    values.fuelType ? `${values.fuelType.toLowerCase()} engine` : "",
    values.mileage ? `${Number(values.mileage).toLocaleString("en-KE")} km mileage` : "",
    values.color ? `${values.color} finish` : "",
  ].filter(Boolean).join(", ");
  if (specLine) bits.push(`Key specs include ${specLine}.`);

  if (Array.isArray(features) && features.length > 0) {
    const top = features.slice(0, 6).join(", ");
    bits.push(`Highlighted features: ${top}${features.length > 6 ? ", and more." : "."}`);
  }

  bits.push("Contact the dealer for inspection, test drive, and final offer.");
  return bits.join(" ");
}

/** Label sits inside the control — compact, dealer-friendly. */
function InfieldGroup({ label, required, className = "", children }) {
  return (
    <div
      className={`rounded-2xl border border-[#e5e0d8] dark:border-slate-700 bg-gradient-to-br from-white via-[#fcfbfa] to-[#f3f0ea] dark:from-[#181818] dark:via-[#131313] dark:to-[#0f0f0f] px-3.5 pt-2 pb-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:shadow-none transition focus-within:border-[#ff5a2f] focus-within:ring-2 focus-within:ring-[#ff5a2f]/18 ${className}`}
    >
      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#ff5a2f]">
        {label}
        {required ? <span className="text-slate-400 dark:text-slate-500"> *</span> : null}
      </div>
      <div className="mt-1">{children}</div>
    </div>
  );
}

export default function CarForm({ dealers = [], car = null, action, method = "POST" }) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 40 }, (_, i) => currentYear - i);

  const isEdit = method === "PUT" && !!car;
  const isPortal = action?.startsWith("/api/portal/");
  const isNew = !isEdit;

  const dealerScope = dealers?.[0]?.id || "shared";
  const draftKey = useMemo(
    () => (isNew ? `welsh-motors:car-draft:${isPortal ? "portal" : "admin"}:${dealerScope}` : null),
    [isNew, isPortal, dealerScope]
  );
  const defaultsKey = useMemo(
    () => `welsh-motors:car-defaults:${isPortal ? "portal" : "admin"}:${dealerScope}`,
    [isPortal, dealerScope]
  );

  const baseSeed = useMemo(() => buildBaseSeed(car, currentYear), [car, currentYear]);

  const [formSeed, setFormSeed] = useState(baseSeed);
  /** Bumps when a fresh portal "new" form is initialized so uncontrolled fields (e.g. price) remount empty. */
  const [formInstanceKey, setFormInstanceKey] = useState(0);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
  const [images, setImages] = useState(
    car?.images?.map((img) => ({ url: img.url, isPrimary: img.isPrimary })) || []
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const badges = useMemo(() => car?.badges || [], [car]);
  /** Uncontrolled features field (like price) — avoids state being overwritten on re-render. */
  const featuresTextareaRef = useRef(null);
  const [featuresRev, setFeaturesRev] = useState(0);
  const bumpFeaturesInput = useCallback(() => setFeaturesRev((n) => n + 1), []);
  const initialFeaturesDisplay = useMemo(() => {
    if (!Array.isArray(car?.features) || !car.features.length) return "";
    return car.features.join(", ");
  }, [car?.id, formInstanceKey]);
  const parsedFeatures = useMemo(
    () => parseCommaFeatures(featuresTextareaRef.current?.value ?? ""),
    [featuresRev]
  );
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [selectedMake, setSelectedMake] = useState((baseSeed.make || "").trim());
  const [modelOptions, setModelOptions] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelSources, setModelSources] = useState(["inventory"]);
  const [selectedModel, setSelectedModel] = useState((baseSeed.model || "").trim());
  const [selectedYear, setSelectedYear] = useState(String(baseSeed.year || currentYear));
  const [selectedDealerId, setSelectedDealerId] = useState(baseSeed.dealerId || dealers?.[0]?.id || "");
  const [variantOptions, setVariantOptions] = useState([]);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [variantSources, setVariantSources] = useState(["inventory"]);
  const [descriptionTouched, setDescriptionTouched] = useState(Boolean((formSeed.description || "").trim()));
  const [liveDraft, setLiveDraft] = useState({});

  const formRef = useRef(null);
  const initializedNewFormRef = useRef(false);
  const saveTimeoutRef = useRef(null);
  const uploadedLocalMapRef = useRef(new Map());
  const pendingUploadIdsRef = useRef(new Set());
  const inputCls = "w-full bg-[#fbfcfe] dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-[#ff5a2f] transition-all";
  const selectCls = "w-full bg-[#fbfcfe] dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-[#ff5a2f] transition-all appearance-none";
  const inField =
    "block w-full min-h-[1.5rem] border-0 bg-transparent p-0 text-base font-semibold text-slate-900 dark:text-white outline-none ring-0 focus:ring-0 placeholder:text-slate-400";
  const inFieldSelect = `${inField} appearance-none cursor-pointer pr-1`;
  const previewTitle = `${liveDraft.year || selectedYear || ""} ${liveDraft.make || selectedMake || ""} ${liveDraft.model || selectedModel || ""}`.trim() || "Your listing preview";
  const previewVariant = liveDraft.variant || "";
  const previewDescription = String(liveDraft.description || formSeed.description || "").trim();
  const previewPrice = liveDraft.price || "";
  const saveDraft = useCallback(() => {
    if (!draftKey || !isNew || !formRef.current) return;

    const fields = collectFormSnapshot(formRef.current);
    const featuresFromDom =
      formRef.current?.querySelector('textarea[data-field="features"]')?.value ?? "";
    localStorage.setItem(
      draftKey,
      JSON.stringify({
        fields,
        images,
        badges,
        featuresText: featuresFromDom,
        updatedAt: Date.now(),
      })
    );
  }, [draftKey, images, isNew, badges]);

  useEffect(() => {
    if (!isNew) return;
    if (initializedNewFormRef.current) return;
    initializedNewFormRef.current = true;
    if (draftKey) localStorage.removeItem(draftKey);
    localStorage.removeItem(defaultsKey);
    setFormSeed(baseSeed);
    setImages([]);
    setFormInstanceKey((k) => k + 1);
  }, [baseSeed, defaultsKey, draftKey, isNew]);

  useEffect(() => {
    if (!isNew || !draftKey || !formRef.current) return;

    const form = formRef.current;
    const scheduleSave = () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => saveDraft(), 350);
    };

    form.addEventListener("input", scheduleSave);
    form.addEventListener("change", scheduleSave);
    window.addEventListener("beforeunload", saveDraft);

    return () => {
      form.removeEventListener("input", scheduleSave);
      form.removeEventListener("change", scheduleSave);
      window.removeEventListener("beforeunload", saveDraft);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [draftKey, isNew, saveDraft]);

  useEffect(() => {
    if (isNew) saveDraft();
  }, [images, isNew, saveDraft]);

  /** After mount / remount, refresh features-derived preview from DOM. */
  useEffect(() => {
    setFeaturesRev((n) => n + 1);
  }, [formInstanceKey, car?.id]);

  useEffect(() => {
    const currentMake =
      formRef.current?.querySelector('input[name="make"]')?.value?.trim() ||
      (formSeed.make || "").trim();
    setSelectedMake(currentMake);
  }, [formSeed.make]);

  useEffect(() => {
    const currentModel =
      formRef.current?.querySelector('input[name="model"]')?.value?.trim() ||
      (formSeed.model || "").trim();
    setSelectedModel(currentModel);
  }, [formSeed.model]);

  useEffect(() => {
    const currentYearValue =
      formRef.current?.querySelector('select[name="year"]')?.value?.trim() ||
      String(formSeed.year || currentYear);
    setSelectedYear(currentYearValue);
  }, [currentYear, formSeed.year]);

  useEffect(() => {
    const make = selectedMake.trim();
    if (!make) {
      setModelOptions([]);
      setLoadingModels(false);
      setModelSources(["inventory"]);
      return;
    }

    const controller = new AbortController();

    async function loadModels() {
      setLoadingModels(true);
      try {
        const res = await fetch(`/api/cars/models?make=${encodeURIComponent(make)}&limit=300`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Failed to load models");
        const data = await res.json();
        setModelOptions(Array.isArray(data.models) ? data.models : []);
        setModelSources(Array.isArray(data.sources) && data.sources.length > 0 ? data.sources : ["inventory"]);
      } catch (err) {
        if (err?.name !== "AbortError") {
          setModelOptions([]);
          setModelSources(["inventory"]);
        }
      } finally {
        if (!controller.signal.aborted) setLoadingModels(false);
      }
    }

    loadModels();
    return () => controller.abort();
  }, [selectedMake]);

  useEffect(() => {
    const make = selectedMake.trim();
    const model = selectedModel.trim();
    const year = String(selectedYear || "").trim();
    if (!make || !model) {
      setVariantOptions([]);
      setLoadingVariants(false);
      setVariantSources(["inventory"]);
      return;
    }

    const controller = new AbortController();

    async function loadVariants() {
      setLoadingVariants(true);
      try {
        const res = await fetch(
          `/api/cars/variants?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&year=${encodeURIComponent(year)}&limit=260`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error("Failed to load variants");
        const data = await res.json();
        setVariantOptions(Array.isArray(data.variants) ? data.variants : []);
        setVariantSources(Array.isArray(data.sources) && data.sources.length > 0 ? data.sources : ["inventory"]);
      } catch (err) {
        if (err?.name !== "AbortError") {
          setVariantOptions([]);
          setVariantSources(["inventory"]);
        }
      } finally {
        if (!controller.signal.aborted) setLoadingVariants(false);
      }
    }

    loadVariants();
    return () => controller.abort();
  }, [selectedMake, selectedModel, selectedYear]);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    const updateLiveDraft = () => setLiveDraft(collectFormSnapshot(form));
    updateLiveDraft();
    form.addEventListener("input", updateLiveDraft);
    form.addEventListener("change", updateLiveDraft);
    return () => {
      form.removeEventListener("input", updateLiveDraft);
      form.removeEventListener("change", updateLiveDraft);
    };
  }, [images]);

  const applyGeneratedDescription = useCallback((force = false) => {
    if (descriptionTouched && !force) return;
    const values = { ...liveDraft, make: selectedMake || liveDraft.make, model: selectedModel || liveDraft.model, year: selectedYear || liveDraft.year };
    const generated = buildAutoDescription(values, parsedFeatures);
    const form = formRef.current;
    const field = form?.querySelector('textarea[name="description"]');
    if (field) {
      field.value = generated;
      field.dispatchEvent(new Event("input", { bubbles: true }));
      field.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }, [descriptionTouched, liveDraft, parsedFeatures, selectedMake, selectedModel, selectedYear]);

  useEffect(() => {
    const existingDescription = formRef.current?.querySelector('textarea[name="description"]')?.value || "";
    if (existingDescription.trim()) return;
    applyGeneratedDescription(false);
  }, [applyGeneratedDescription]);

  function normalizeImagePayload(list) {
    const unique = [];
    const seen = new Set();
    for (const item of list) {
      if (!item?.url || seen.has(item.url)) continue;
      seen.add(item.url);
      unique.push({ url: item.url, isPrimary: Boolean(item.isPrimary) });
    }
    if (unique.length > 0 && !unique.some((img) => img.isPrimary)) unique[0].isPrimary = true;
    return unique;
  }

  async function handleFilesSelected(newFiles) {
    const withKnownUrls = normalizeImagePayload(
      newFiles.map((f) => ({
        url: f.url || uploadedLocalMapRef.current.get(f.id) || null,
        isPrimary: f.isPrimary,
      }))
    );
    if (withKnownUrls.length) setImages(withKnownUrls);

    const toUpload = newFiles.filter(
      (f) => !f.url && f.id && !uploadedLocalMapRef.current.has(f.id) && !pendingUploadIdsRef.current.has(f.id)
    );
    if (!toUpload.length) return;

    setUploading(true);
    setError("");
    setUploadProgress({ done: 0, total: toUpload.length });
    toUpload.forEach((f) => pendingUploadIdsRef.current.add(f.id));

    const results = await Promise.allSettled(
      toUpload.map(async (file) => {
        const formData = new FormData();
        const selectedDealerName =
          dealers.find((dealer) => dealer.id === selectedDealerId)?.name ||
          dealers?.[0]?.name ||
          "";
        const watermarkText = selectedDealerName.trim() || "WELSH MOTORS";
        formData.append("file", file);
        formData.append("watermarkText", watermarkText);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || `Failed: ${file.name}`);
        uploadedLocalMapRef.current.set(file.id, data.url);
        setUploadProgress((prev) => ({ ...prev, done: prev.done + 1 }));
        return data.url;
      })
    );

    toUpload.forEach((f) => pendingUploadIdsRef.current.delete(f.id));
    const failures = results.filter((r) => r.status === "rejected").map((r) => r.reason.message);
    const finalPayload = normalizeImagePayload(
      newFiles.map((f) => ({
        url: f.url || uploadedLocalMapRef.current.get(f.id) || null,
        isPrimary: f.isPrimary,
      }))
    );
    setImages(finalPayload);

    if (failures.length > 0) setError(`${failures.length} upload(s) failed: ${failures.join(", ")}`);

    setUploading(false);
    setUploadProgress({ done: 0, total: 0 });
  }

  function clearDraft() {
    if (!draftKey) return;
    localStorage.removeItem(draftKey);
  }


  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());

    data.images = images;
    const featuresRaw =
      featuresTextareaRef.current?.value ??
      formRef.current?.querySelector('textarea[data-field="features"]')?.value ??
      "";
    data.features = parseCommaFeatures(featuresRaw);
    data.badges = badges;

    data.year = parseInt(data.year, 10);

    const priceRaw =
      data.price != null && String(data.price).trim() !== ""
        ? String(data.price)
        : String(formRef.current?.querySelector('input[name="price"]')?.value ?? "");
    data.price = parsePriceInputToKesInt(priceRaw);
    if (!Number.isFinite(data.price) || data.price < 1) {
      setError("Enter a valid price in KES (whole numbers only).");
      setSubmitting(false);
      return;
    }

    data.mileage = data.mileage ? parseInt(data.mileage, 10) : null;
    data.engineCC = data.engineCC ? parseInt(data.engineCC, 10) : null;
    data.groundClearanceMm = data.groundClearanceMm ? parseInt(data.groundClearanceMm, 10) : null;
    data.spareAvailability = data.spareAvailability ? parseInt(data.spareAvailability, 10) : null;
    data.hybridBatteryTech = data.hybridBatteryTech ? data.hybridBatteryTech : null;
    data.cylinders = data.cylinders ? parseInt(data.cylinders, 10) : null;
    data.horsepower = data.horsepower ? parseInt(data.horsepower, 10) : null;
    data.torque = data.torque ? parseInt(data.torque, 10) : null;
    data.airbags = data.airbags ? parseInt(data.airbags, 10) : null;
    data.seats = data.seats ? parseInt(data.seats, 10) : null;

    data.negotiable = isEdit ? !!car?.negotiable : false;
    data.imported = isEdit ? !!car?.imported : true;
    data.featured = isEdit ? !!car?.featured : false;
    data.turbo = data.turbo === "on";
    data.sunroof = data.sunroof === "on";
    {
      const r = String(data.registered ?? "").toLowerCase();
      data.registered = !(r === "false" || r === "0" || r === "off" || r === "no");
    }

    try {
      const res = await fetch(action, {
        method: method === "PUT" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to save");

      localStorage.setItem(
        defaultsKey,
        JSON.stringify({
          make: data.make,
          fuelType: data.fuelType,
          transmission: data.transmission,
          bodyType: data.bodyType,
          condition: data.condition,
          imported: data.imported,
          negotiable: data.negotiable,
        })
      );

      if (draftKey) {
        localStorage.removeItem(draftKey);
      }
      
      window.location.href = result.redirectTo || (isPortal ? "/portal" : "/admin/cars");
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 animate-in fade-in duration-700">
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-black uppercase tracking-widest rounded-xl sm:rounded-2xl px-4 py-3 sm:px-6 sm:py-4 flex items-center gap-3">
          <Info size={16} />
          {error}
        </div>
      )}

      {dealers.length > 1 && (
        <InfieldGroup label="Assigned dealer" required>
          <select
            name="dealerId"
            defaultValue={formSeed.dealerId || ""}
            required
            className={inFieldSelect}
            onChange={(e) => setSelectedDealerId(e.target.value)}
          >
            <option value="">Select dealer</option>
            {dealers.map((dealer) => (
              <option key={dealer.id} value={dealer.id}>{dealer.name} — {dealer.location}</option>
            ))}
          </select>
        </InfieldGroup>
      )}
      {dealers.length === 1 && dealers[0] && <input type="hidden" name="dealerId" value={dealers[0].id} />}

      <div className="space-y-5 sm:space-y-6">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 mb-3">Listing</p>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <InfieldGroup label="Make" required>
                <input
                  name="make"
                  list="make-list"
                  required
                  defaultValue={formSeed.make}
                  placeholder="Toyota"
                  className={inField}
                  onChange={(e) => {
                    const nextMake = e.target.value.trim();
                    const currentMake = selectedMake.trim();
                    if (nextMake.toLowerCase() !== currentMake.toLowerCase()) {
                      const modelInput = formRef.current?.querySelector('input[name="model"]');
                      const variantInput = formRef.current?.querySelector('input[name="variant"]');
                      if (modelInput) modelInput.value = "";
                      if (variantInput) variantInput.value = "";
                      setSelectedModel("");
                      setVariantOptions([]);
                      setVariantSources(["inventory"]);
                    }
                    setSelectedMake(nextMake);
                  }}
                />
              </InfieldGroup>
              <datalist id="make-list">
                {MAKES.map((make) => <option key={make} value={make} />)}
              </datalist>
            </div>
            <div>
              <InfieldGroup label="Model" required>
                <input
                  name="model"
                  list="model-list"
                  required
                  defaultValue={formSeed.model}
                  placeholder={selectedMake ? `${selectedMake} model` : "Model"}
                  className={inField}
                  onChange={(e) => {
                    const nextModel = e.target.value.trim();
                    const currentModel = selectedModel.trim();
                    if (nextModel.toLowerCase() !== currentModel.toLowerCase()) {
                      const variantInput = formRef.current?.querySelector('input[name="variant"]');
                      if (variantInput) variantInput.value = "";
                      setVariantOptions([]);
                      setVariantSources(["inventory"]);
                    }
                    setSelectedModel(nextModel);
                  }}
                />
              </InfieldGroup>
              <datalist id="model-list">
                {modelOptions.map((model) => <option key={model} value={model} />)}
              </datalist>
              <p className="mt-1.5 text-[10px] font-medium text-slate-500">
                {selectedMake ? (loadingModels ? "Loading models…" : `${modelOptions.length} suggestions`) : "Pick make first"}
              </p>
            </div>
            <div>
              <InfieldGroup label="Variant">
                <input
                  name="variant"
                  list="variant-list"
                  defaultValue={formSeed.variant}
                  placeholder="Trim / grade"
                  className={inField}
                />
              </InfieldGroup>
              <datalist id="variant-list">
                {variantOptions.map((variant) => <option key={variant} value={variant} />)}
              </datalist>
              <p className="mt-1.5 text-[10px] font-medium text-slate-500">
                {selectedMake && selectedModel ? (loadingVariants ? "Loading variants…" : `${variantOptions.length} suggestions`) : "After make & model"}
              </p>
            </div>

            <InfieldGroup label="Year" required>
              <select
                name="year"
                defaultValue={formSeed.year}
                required
                className={inFieldSelect}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                {years.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
            </InfieldGroup>
            <InfieldGroup label="Condition" required>
              <select name="condition" defaultValue={formSeed.condition} required className={inFieldSelect}>
                {CONDITIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </InfieldGroup>
            <InfieldGroup label="Kenya registration" required>
              <select name="registered" defaultValue={formSeed.registered ? "true" : "false"} required className={inFieldSelect}>
                <option value="true">Registered</option>
                <option value="false">Not registered</option>
              </select>
            </InfieldGroup>
            <div>
              <InfieldGroup label="Price (KES)" required>
                <input
                  key={`price-${car?.id ?? "new"}-${formInstanceKey}`}
                  name="price"
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  enterKeyHint="done"
                  required
                  defaultValue={
                    (car?.price ?? formSeed.price) != null && (car?.price ?? formSeed.price) !== ""
                      ? String(car?.price ?? formSeed.price)
                      : ""
                  }
                  placeholder="e.g. 2,500,000 or 2.5M"
                  className={`${inField} min-h-[1.75rem]`}
                />
              </InfieldGroup>
              <p className="mt-1.5 text-[10px] font-medium text-slate-500">
                We leave your typing as-is here; commas and optional M (millions) are read when you publish.
              </p>
            </div>

            <InfieldGroup label="Mileage (km)">
              <input name="mileage" type="number" inputMode="numeric" defaultValue={formSeed.mileage} placeholder="52000" className={inField} />
            </InfieldGroup>
            <InfieldGroup label="Fuel" required>
              <select name="fuelType" defaultValue={formSeed.fuelType} required className={inFieldSelect}>
                {Object.entries(FUEL_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </InfieldGroup>
            <InfieldGroup label="Transmission" required>
              <select name="transmission" defaultValue={formSeed.transmission} required className={inFieldSelect}>
                {Object.entries(TRANSMISSION_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </InfieldGroup>
            <InfieldGroup label="Color" required>
              <input name="color" required defaultValue={formSeed.color} placeholder="Pearl white" className={inField} />
            </InfieldGroup>
            <InfieldGroup label="Body type" required>
              <select name="bodyType" defaultValue={formSeed.bodyType} required className={inFieldSelect}>
                {Object.entries(BODY_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </InfieldGroup>
            <InfieldGroup label="Drivetrain">
              <select name="drivetrain" defaultValue={formSeed.drivetrain || ""} className={inFieldSelect}>
                <option value="">Select drivetrain…</option>
                {Object.entries(DRIVETRAIN_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </InfieldGroup>
            <InfieldGroup label="Steering">
              <select name="steering" defaultValue={formSeed.steering} className={inFieldSelect}>
                {Object.entries(STEERING_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </InfieldGroup>
          </div>
        </div>

        <div>
          <div className="bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 mb-4">Photos</p>
            {uploading && (
              <div className="text-center mb-8 p-6 bg-[#fbfcfe] dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl">
                <div className="w-10 h-10 border-4 border-[#ff5a2f] border-t-transparent rounded-2xl animate-spin mx-auto mb-4" />
                <p className="text-sm font-bold text-slate-900 dark:text-white uppercase">Uploading Images...</p>
                <p className="text-[11px] font-bold text-slate-500 mt-2">Image {uploadProgress.done} of {uploadProgress.total}</p>
              </div>
            )}
            <div className={uploading ? "opacity-50 pointer-events-none" : ""}>
              <MediaUploader initialImages={images} onFilesSelected={handleFilesSelected} maxFiles={15} />
            </div>
            <p className="mt-3 text-[11px] font-medium text-slate-500">Uploads start in the background.</p>
          </div>
        </div>

        <div>
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Description</p>
                  <button
                    type="button"
                    onClick={() => applyGeneratedDescription(true)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider"
                  >
                    Generate from specs
                  </button>
                </div>
                <InfieldGroup label="Tell buyers about the car">
                  <textarea
                    name="description"
                    rows={5}
                    defaultValue={formSeed.description}
                    onChange={() => {
                      setDescriptionTouched(true);
                    }}
                    placeholder="Condition, service history, tyres, known issues…"
                    className={`${inField} resize-y min-h-[7.5rem] text-sm leading-relaxed`}
                  />
                </InfieldGroup>
                <p className="mt-2 text-[11px] font-medium text-slate-500">Honest detail builds trust.</p>
              </div>
              <div className="bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 mb-3">Features</p>
                <InfieldGroup label="List features, comma-separated">
                  <textarea
                    ref={featuresTextareaRef}
                    data-field="features"
                    key={`features-${car?.id ?? "new"}-${formInstanceKey}`}
                    defaultValue={initialFeaturesDisplay}
                    onInput={bumpFeaturesInput}
                    rows={3}
                    placeholder="Leather seats, Sunroof, Reverse camera…"
                    className={`${inField} resize-y min-h-[4.5rem] text-sm leading-relaxed`}
                  />
                </InfieldGroup>
                <p className="mt-2 text-[11px] font-medium text-slate-500">
                  Separate with commas. We trim spaces and skip empty items when you publish ({parsedFeatures.length} listed).
                </p>
              </div>
            <div className="bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Advanced specs</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setAdvancedOpen((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-[#ddd4c8] dark:border-slate-700 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                >
                  {advancedOpen ? "Collapse" : "Expand"}
                  <ChevronRight size={14} className={`transition-transform ${advancedOpen ? "rotate-90" : ""}`} />
                </button>
              </div>
              {advancedOpen ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <InfieldGroup label="Engine CC">
                    <input name="engineCC" type="number" inputMode="numeric" defaultValue={formSeed.engineCC} placeholder="2000" className={inField} />
                  </InfieldGroup>
                  <InfieldGroup label="Ground clearance (mm)">
                    <input name="groundClearanceMm" type="number" inputMode="numeric" defaultValue={formSeed.groundClearanceMm} placeholder="185" className={inField} />
                  </InfieldGroup>
                  <InfieldGroup label="Spare availability (1–10)">
                    <input name="spareAvailability" type="number" inputMode="numeric" min="1" max="10" defaultValue={formSeed.spareAvailability} placeholder="8" className={inField} />
                  </InfieldGroup>
                  <InfieldGroup label="Hybrid battery">
                    <select name="hybridBatteryTech" defaultValue={formSeed.hybridBatteryTech} className={inFieldSelect}>
                      {Object.entries(HYBRID_BATTERY_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </InfieldGroup>
                  <InfieldGroup label="Cylinders">
                    <input name="cylinders" type="number" inputMode="numeric" defaultValue={formSeed.cylinders} placeholder="4" className={inField} />
                  </InfieldGroup>
                  <InfieldGroup label="Horsepower">
                    <input name="horsepower" type="number" inputMode="numeric" defaultValue={formSeed.horsepower} placeholder="180" className={inField} />
                  </InfieldGroup>
                  <InfieldGroup label="Torque (Nm)">
                    <input name="torque" type="number" inputMode="numeric" defaultValue={formSeed.torque} placeholder="280" className={inField} />
                  </InfieldGroup>
                  <InfieldGroup label="Airbags">
                    <input name="airbags" type="number" inputMode="numeric" defaultValue={formSeed.airbags} placeholder="6" className={inField} />
                  </InfieldGroup>
                  <InfieldGroup label="Seats">
                    <input name="seats" type="number" inputMode="numeric" defaultValue={formSeed.seats} placeholder="5" className={inField} />
                  </InfieldGroup>
                  <div className="sm:col-span-2 lg:col-span-4 flex flex-wrap gap-6 pt-1">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" name="turbo" defaultChecked={!!formSeed.turbo} className="w-4 h-4 accent-[#ff5a2f]" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Turbo</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" name="sunroof" defaultChecked={!!formSeed.sunroof} className="w-4 h-4 accent-[#ff5a2f]" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Sunroof</span>
                    </label>
                  </div>
                </div>
              ) : (
                <p className="text-xs font-semibold text-slate-500">
                  Advanced specs are collapsed by default for faster listing. Expand when needed.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-between items-center gap-3 pt-2">
          <a href={isPortal ? "/portal" : "/admin"} className="px-5 py-2.5 sm:px-6 sm:py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl sm:rounded-2xl text-[11px] sm:text-xs uppercase tracking-wider transition-all">
            Cancel
          </a>
          <button
            type="submit"
            disabled={submitting || uploading}
            className="px-6 py-2.5 sm:px-8 sm:py-3 bg-[#ff5a2f] hover:bg-emerald-700 disabled:opacity-50 text-slate-900 dark:text-white font-bold rounded-xl sm:rounded-2xl text-[11px] sm:text-xs uppercase tracking-wider transition-all inline-flex items-center justify-center gap-2"
          >
            {submitting ? "Saving..." : isEdit ? "Save" : "Publish"}
            {!submitting && <Check size={16} />}
          </button>
        </div>

        <div className="bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Preview</p>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="w-full sm:w-36 h-20 sm:h-24 rounded-lg sm:rounded-xl overflow-hidden bg-slate-100 border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0">
              {images[0]?.url ? <img src={images[0].url} alt="" className="w-full h-full object-cover" /> : <span className="text-[11px] text-slate-400">No photo</span>}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-slate-900 dark:text-white truncate">{previewTitle}</p>
              {previewVariant && <p className="text-xs font-semibold text-slate-500 truncate">{previewVariant}</p>}
              <p className="text-sm font-bold text-[#ff5a2f] mt-1">{previewPrice ? `KES ${Number(previewPrice || 0).toLocaleString("en-KE")}` : "—"}</p>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{previewDescription || "—"}</p>
            </div>
          </div>
        </div>
      </div>
    </form>
    );
  }

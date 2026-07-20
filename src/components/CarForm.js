"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronRight, Info, Loader2, Sparkles } from "lucide-react";
import MediaUploader from "./admin/MediaUploader";
import {
  BODY_TYPE_LABELS,
  DRIVETRAIN_LABELS,
  FUEL_LABELS,
  STEERING_LABELS,
  TRANSMISSION_LABELS,
  VEHICLE_TYPE_LABELS,
} from "@/lib/utils";
import { CAR_STATUS_LABELS } from "@/lib/constants";

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


function buildBaseSeed(car, currentYear, initialDealerId, dealers) {
  let dealerId = car?.dealerId || "";
  if (!dealerId && initialDealerId && dealers?.some((d) => d.id === initialDealerId)) {
    dealerId = initialDealerId;
  }
  return {
    dealerId,
    make: car?.make || "",
    model: car?.model || "",
    variant: car?.variant || "",
    year: car?.year || "",
    condition: car?.condition || "",
    price: car?.price || "",
    mileage: car?.mileage || "",
    fuelType: car?.fuelType || "",
    transmission: car?.transmission || "",
    bodyType: car?.bodyType || "",
    engineCC: car?.engineCC || "",
    groundClearanceMm: car?.groundClearanceMm || "",
    hybridBatteryTech: "",
    spareAvailability: car?.spareAvailability || "",
    cylinders: car?.cylinders || "",
    horsepower: car?.horsepower || "",
    torque: car?.torque || "",
    drivetrain: car?.drivetrain ?? "",
    steering: car?.steering || "",
    airbags: car?.airbags || "",
    seats: car?.seats || "",
    color: car?.color || "",
    description: car?.description || "",
    negotiable: car?.negotiable ?? false,
    imported: car?.imported ?? null,
    registered: car?.registered ?? null,
    turbo: car?.turbo ?? false,
    sunroof: car?.sunroof ?? false,
    featured: car?.featured ?? false,
    carStatus: car?.carStatus || "",
    location: car?.location || "",
    importCountry: car?.importCountry || "",
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

function InfieldGroup({ label, required, className = "", children }) {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">
        {label}
        {required ? <span className="text-zinc-600"> *</span> : null}
      </label>
      {children}
    </div>
  );
}

export default function CarForm({ dealers = [], car = null, action, method = "POST", initialDealerId = null }) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 47 }, (_, i) => currentYear - i);

  const isEdit = method === "PUT" && !!car;
  const isPortal = false;
  /** Dealer portal + admin car create/edit all need the same mobile/desktop publish chrome */
  const useMobileDock = Boolean(isPortal || action?.startsWith("/api/admin/cars"));
  const isNew = !isEdit;

  const dealerScope = dealers?.[0]?.id || "shared";
  const draftKey = useMemo(
    () => (isNew ? `welsh-motorhub:car-draft:${isPortal ? "portal" : "admin"}:${dealerScope}` : null),
    [isNew, isPortal, dealerScope]
  );
  const defaultsKey = useMemo(
    () => `welsh-motorhub:car-defaults:${isPortal ? "portal" : "admin"}:${dealerScope}`,
    [isPortal, dealerScope]
  );
  const legacyDraftKey = useMemo(
    () => (isNew ? `welsh-motors:car-draft:${isPortal ? "portal" : "admin"}:${dealerScope}` : null),
    [isNew, isPortal, dealerScope]
  );
  const legacyDefaultsKey = useMemo(
    () => `welsh-motors:car-defaults:${isPortal ? "portal" : "admin"}:${dealerScope}`,
    [isPortal, dealerScope]
  );

  const baseSeed = useMemo(
    () => buildBaseSeed(car, currentYear, initialDealerId, dealers),
    [car, currentYear, initialDealerId, dealers]
  );

  const [formSeed, setFormSeed] = useState(baseSeed);
  /** Bumps when a fresh portal "new" form is initialized so uncontrolled fields (e.g. price) remount empty. */
  const [formInstanceKey, setFormInstanceKey] = useState(0);
  const [vehicleType, setVehicleType] = useState(car?.vehicleType || "CAR");

  const [uploading, setUploading] = useState(false);
  const [uploadFailed, setUploadFailed] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
  const [images, setImages] = useState(
    car?.images?.map((img) => ({ url: img.url, isPrimary: img.isPrimary })) || []
  );
  /** Blob or URL for listing preview before / without server URLs; cleared when images carry a primary URL. */
  const [coverDisplaySrc, setCoverDisplaySrc] = useState(null);
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
  const [advancedOpen, setAdvancedOpen] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("carform_advanced_open");
      if (saved !== null) return saved === "true";
    }
    return false;
  });
  const [selectedMake, setSelectedMake] = useState((baseSeed.make || "").trim());
  const [modelOptions, setModelOptions] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelSources, setModelSources] = useState(["inventory"]);
  const [selectedModel, setSelectedModel] = useState((baseSeed.model || "").trim());
  const [selectedYear, setSelectedYear] = useState(String(baseSeed.year || currentYear));
  const [selectedDealerId, setSelectedDealerId] = useState(baseSeed.dealerId || dealers?.[0]?.id || "");
  const [variantValue, setVariantValue] = useState((baseSeed.variant || "").trim());
  const [variantOptions, setVariantOptions] = useState([]);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [variantSources, setVariantSources] = useState(["inventory"]);
  const descriptionTouched = true;
  const [liveDraft, setLiveDraft] = useState({});

  const formRef = useRef(null);
  const [publishReady, setPublishReady] = useState(false);

  const parseTextareaRef = useRef(null);
  const [parsing, setParsing] = useState(false);
  const [parseResult, setParseResult] = useState(null);
  const [smartFillOpen, setSmartFillOpen] = useState(false);

  const handleSmartFill = useCallback(async () => {
    const text = (parseTextareaRef.current?.value || "").trim();
    if (!text) return;

    setParsing(true);
    setParseResult(null);
    try {
      const res = await fetch("/api/cars/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("Parse failed");
      const result = await res.json();
      setParseResult(result);

      if (!result.success || !result.data) return;

      const d = result.data;
      const form = formRef.current;
      if (!form) return;

      const fields = [
        "make", "model", "variant",
        { name: "year", value: d.year ? String(d.year) : null },
        { name: "price", value: d.price ? String(d.price) : null },
        { name: "mileage", value: d.mileage ? String(d.mileage) : null },
        { name: "engineCC", value: d.engineCC ? String(d.engineCC) : null },
        "bodyType", "fuelType", "transmission", "color",
        { name: "condition", value: d.condition ? d.condition.toLowerCase() : null },
        "drivetrain", "steering",
        { name: "seats", value: d.seats ? String(d.seats) : null },
      ];

      for (const f of fields) {
        const name = typeof f === "string" ? f : f.name;
        const value = typeof f === "string" ? d[f] : f.value;
        if (!value) continue;

        const confidence = d.confidence?.[name] ?? 0;
        if (confidence < 0.4) continue;

        const target = form.querySelector(`[name="${name}"]`);
        if (!target) continue;

        const currentVal = target.value?.trim();
        if (currentVal && currentVal !== "" && currentVal !== "0") continue;

        target.value = value;
        target.dispatchEvent(new Event("input", { bubbles: true }));
        target.dispatchEvent(new Event("change", { bubbles: true }));
      }

      if (d.make) setSelectedMake(d.make);
      if (d.model) setSelectedModel(d.model);
      if (d.variant) setVariantValue(d.variant);
      if (d.year) {
        setSelectedYear(String(d.year));
        setFormSeed((prev) => ({ ...prev, year: String(d.year) }));
      }


    } catch (err) {
      setError(err.message);
    } finally {
      setParsing(false);
    }
  }, [bumpFeaturesInput]);

  const initializedNewFormRef = useRef(false);

  useEffect(() => {
    localStorage.setItem("carform_advanced_open", advancedOpen);
  }, [advancedOpen]);

  useEffect(() => {
    if (car) {
      const hasAdvanced =
        car.groundClearanceMm ||
        car.spareAvailability ||
        car.cylinders ||
        car.horsepower ||
        car.torque ||
        car.airbags ||
        car.seats ||
        car.turbo ||
        car.sunroof;
      if (hasAdvanced) setAdvancedOpen(true);
    }
  }, [car]);
  const saveTimeoutRef = useRef(null);
  const uploadedLocalMapRef = useRef(new Map());
  const pendingUploadIdsRef = useRef(new Set());
  /** Latest uploader file list (for post-upload payload if user toggles include while uploading). */
  const latestUploaderSelectionRef = useRef([]);
  const inputCls = "w-full border border-zinc-700 rounded-lg px-3 py-2.5 text-sm font-semibold text-white bg-zinc-900 placeholder:text-zinc-500 outline-none focus:border-emerald-500 transition-all";
  const selectCls = `${inputCls} appearance-none`;
  const inField =
    "block w-full border border-zinc-700 rounded-lg px-3 py-2.5 text-sm font-semibold text-white bg-zinc-900 outline-none focus:border-emerald-500 transition-all placeholder:text-zinc-500";
  const inFieldSelect = `${inField} appearance-none cursor-pointer`;
  const previewTitle = `${liveDraft.year || selectedYear || ""} ${liveDraft.make || selectedMake || ""} ${liveDraft.model || selectedModel || ""}`.trim() || "Your listing preview";
  const previewVariant = liveDraft.variant || "";
  const previewDescription = String(liveDraft.description || formSeed.description || "").trim();
  const previewPrice = liveDraft.price || "";
  const previewCoverSrc = useMemo(() => {
    // Ref first — always has the latest files before any state flush
    const latest = latestUploaderSelectionRef.current;
    if (latest.length > 0) {
      const p = latest.find((f) => f.isPrimary) || latest[0];
      const src = p?.url || p?.preview || null;
      if (src) return src;
    }
    // Fall back to explicitly set cover state
    if (coverDisplaySrc) return coverDisplaySrc;
    // Last resort — already-stored images
    const p = images.find((i) => i.isPrimary) || images[0];
    return p?.url || null;
  }, [coverDisplaySrc, images]);
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
    if (legacyDraftKey) localStorage.removeItem(legacyDraftKey);
    localStorage.removeItem(defaultsKey);
    localStorage.removeItem(legacyDefaultsKey);
    setFormSeed(baseSeed);
    setImages([]);
    setFormInstanceKey((k) => k + 1);
  }, [baseSeed, defaultsKey, draftKey, legacyDefaultsKey, legacyDraftKey, isNew]);

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
    setCoverDisplaySrc(null);
  }, [car?.id, formInstanceKey]);

  // Defensive sync: if coverDisplaySrc is null but the ref has included
  // files, restore the preview from the ref. Handles edge cases where
  // coverDisplaySrc gets cleared unexpectedly.
  useEffect(() => {
    if (coverDisplaySrc) return;
    const latest = latestUploaderSelectionRef.current;
    const activeInRef = latest.filter((f) => f.included !== false);
    if (activeInRef.length === 0) return;
    const p = activeInRef.find((f) => f.isPrimary) || activeInRef[0];
    const src = p?.url || p?.preview || null;
    if (src) setCoverDisplaySrc(src);
  }, [coverDisplaySrc]);

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

  const recalcPublishReady = useCallback(() => {
    const form = formRef.current;
    if (!form) {
      setPublishReady(false);
      return;
    }
    if (uploading || submitting) {
      setPublishReady(false);
      return;
    }
    if (dealers.length > 1 && !String(selectedDealerId || "").trim()) {
      setPublishReady(false);
      return;
    }
    if (!form.checkValidity()) {
      setPublishReady(false);
      return;
    }
    const priceRaw = form.querySelector('input[name="price"]')?.value ?? "";
    const p = parsePriceInputToKesInt(priceRaw);
    if (priceRaw.trim() !== "" && (!Number.isFinite(p) || p < 1)) {
      setPublishReady(false);
      return;
    }
    setPublishReady(true);
  }, [dealers.length, selectedDealerId, uploading, submitting]);

  useEffect(() => {
    recalcPublishReady();
  }, [recalcPublishReady, images, uploading, submitting, formInstanceKey, selectedDealerId]);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return undefined;
    const sync = () => recalcPublishReady();
    sync();
    form.addEventListener("input", sync);
    form.addEventListener("change", sync);
    return () => {
      form.removeEventListener("input", sync);
      form.removeEventListener("change", sync);
    };
  }, [recalcPublishReady]);

  function normalizeImagePayload(list) {
    const unique = [];
    const seen = new Set();
    for (const item of list) {
      if (!item?.url || seen.has(item.url)) continue;
      seen.add(item.url);
      unique.push({ id: item.id, url: item.url, isPrimary: Boolean(item.isPrimary) });
    }
    if (unique.length > 0 && !unique.some((img) => img.isPrimary)) unique[0].isPrimary = true;
    return unique;
  }

  async function compressIfNeeded(file) {
    const isHeic = ["image/heic", "image/heif", "image/avif"].includes(file.type);
    if (file.size <= 3.5 * 1024 * 1024 && !isHeic) return file;
    const compressTo = (fmt, ext, quality) =>
      new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          const MAX = 1600;
          if (width > MAX || height > MAX) {
            const r = Math.min(MAX / width, MAX / height);
            width = Math.round(width * r);
            height = Math.round(height * r);
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          canvas.getContext("2d").drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) resolve(new File([blob], file.name.replace(/\.[^.]+$/, `.${ext}`), { type: fmt }));
              else resolve(null);
            },
            fmt,
            quality
          );
        };
        img.onerror = () => resolve(null);
        const url = URL.createObjectURL(file);
        img.src = url;
      });
    let result = await compressTo("image/webp", "webp", 0.8);
    if (!result) result = await compressTo("image/jpeg", "jpg", 0.9);
    if (!result) result = await compressTo("image/png", "png", 0.9);
    return result || file;
  }

  async function handleFilesSelected(newFiles) {
    setUploadFailed(false);
    latestUploaderSelectionRef.current = newFiles;

    const primaryThumb = (list) => {
      const p = list.find((f) => f.isPrimary) || list[0];
      return p ? p.url || p.preview || null : null;
    };

    const active = newFiles.filter((f) => f.included !== false);

    if (!newFiles.length) {
      setImages([]);
      setCoverDisplaySrc(null);
      return;
    }

    setCoverDisplaySrc(primaryThumb(active));

    if (!active.length) {
      setImages([]);
      setCoverDisplaySrc(null);
      return;
    }

    const withKnownUrls = normalizeImagePayload(
      active.map((f) => ({
        id: f.id,
        url: f.url || uploadedLocalMapRef.current.get(f.id) || null,
        isPrimary: f.isPrimary,
      }))
    );
    if (withKnownUrls.length) setImages(withKnownUrls);

    const toUpload = active.filter(
      (f) => !f.url && f.id && !uploadedLocalMapRef.current.has(f.id) && !pendingUploadIdsRef.current.has(f.id)
    );
    if (!toUpload.length) {
      const snapshot = latestUploaderSelectionRef.current || newFiles;
      const act = snapshot.filter((f) => f.included !== false);
      const finalPayload = normalizeImagePayload(
        act.map((f) => ({
          id: f.id,
          url: f.url || uploadedLocalMapRef.current.get(f.id) || null,
          isPrimary: f.isPrimary,
        }))
      );
      setImages(finalPayload);
      const primaryUrl = (finalPayload.find((i) => i.isPrimary) || finalPayload[0])?.url;
      setCoverDisplaySrc(primaryUrl || primaryThumb(act));
      return;
    }

    setUploading(true);
    setError("");
    setUploadProgress({ done: 0, total: toUpload.length });
    toUpload.forEach((f) => pendingUploadIdsRef.current.add(f.id));

    const results = await Promise.allSettled(
      toUpload.map(async (file) => {
        const toSend = await compressIfNeeded(file);
        const formData = new FormData();
        formData.append("file", toSend);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        let data;
        try {
          data = await res.json();
        } catch {
          const text = await res.text();
          throw new Error(text.slice(0, 120) || `Upload failed (HTTP ${res.status})`);
        }
        if (!res.ok) throw new Error(data.error || `Failed: ${file.name}`);
        uploadedLocalMapRef.current.set(file.id, data.url);
        setUploadProgress((prev) => ({ ...prev, done: prev.done + 1 }));
        return data.url;
      })
    );

    toUpload.forEach((f) => pendingUploadIdsRef.current.delete(f.id));
    const failures = results.filter((r) => r.status === "rejected").map((r) => r.reason.message);
    const snapshot = latestUploaderSelectionRef.current || newFiles;
    const act = snapshot.filter((f) => f.included !== false);
    const finalPayload = normalizeImagePayload(
      act.map((f) => ({
        id: f.id,
        url: f.url || uploadedLocalMapRef.current.get(f.id) || null,
        isPrimary: f.isPrimary,
      }))
    );

    // Only update images if we actually got results — otherwise keep the
    // previous images state. This prevents a car from being published
    // with zero images when every upload attempt fails.
    if (finalPayload.length > 0) {
      setImages(finalPayload);
      const primaryAfter = (finalPayload.find((i) => i.isPrimary) || finalPayload[0])?.url;
      setCoverDisplaySrc(primaryAfter || primaryThumb(act));
    }

    if (failures.length > 0) {
      setUploadFailed(true);
      setError(`${failures.length} upload(s) failed: ${failures.join(", ")}`);
    }

    setUploading(false);
    setUploadProgress({ done: 0, total: 0 });
  }

  function clearDraft() {
    if (!draftKey) return;
    localStorage.removeItem(draftKey);
    if (legacyDraftKey) localStorage.removeItem(legacyDraftKey);
  }


  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setUploadFailed(false);
    setError("");

    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());

    data.vehicleType = vehicleType;
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
    if (priceRaw.trim() !== "" && (!Number.isFinite(data.price) || data.price < 1)) {
      setError("Enter a valid price in KES (whole numbers only).");
      setSubmitting(false);
      return;
    }
    if (priceRaw.trim() === "") data.price = null;

    data.mileage = data.mileage ? parseInt(data.mileage, 10) : null;
    data.engineCC = data.engineCC ? parseInt(data.engineCC, 10) : null;
    data.groundClearanceMm = data.groundClearanceMm ? parseInt(data.groundClearanceMm, 10) : null;
    data.spareAvailability = data.spareAvailability ? parseInt(data.spareAvailability, 10) : null;
    data.hybridBatteryTech = null;
    data.cylinders = data.cylinders ? parseInt(data.cylinders, 10) : null;
    data.horsepower = data.horsepower ? parseInt(data.horsepower, 10) : null;
    data.torque = data.torque ? parseInt(data.torque, 10) : null;
    data.airbags = data.airbags ? parseInt(data.airbags, 10) : null;
    data.seats = data.seats ? parseInt(data.seats, 10) : null;

    data.negotiable = isEdit ? !!car?.negotiable : false;
    data.imported = data.imported === "true";
    data.carStatus = data.carStatus || null;
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
          vehicleType: data.vehicleType,
          make: data.make,
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
      if (legacyDraftKey) {
        localStorage.removeItem(legacyDraftKey);
      }
      
      window.location.href = result.redirectTo || "/admin/cars";
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  const scrollToSection = useCallback((id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const publishBlocked = submitting || uploading || uploadFailed || !publishReady;

  const mobileCancelHref = "/admin/cars";

  const mobileDock = useMobileDock ? (
    <div
      className="lg:hidden fixed left-0 right-0 z-[9999] border-t border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 pt-2.5 pb-[max(0.65rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(0,0,0,0.08)]"
      style={{ bottom: 0 }}
      role="region"
      aria-label="Listing actions"
    >
      <div className="flex items-stretch gap-2 max-w-7xl mx-auto">
        <a href={mobileCancelHref}
          className="flex-1 inline-flex items-center justify-center px-3 py-3 bg-zinc-800 text-zinc-300 font-bold rounded-md text-[10px] uppercase tracking-wider"
        >
          Cancel
        </a>
        <button type="button" disabled={publishBlocked}
          onClick={() => { if (publishBlocked) return; formRef.current?.requestSubmit(); }}
          className="flex-[1.35] inline-flex items-center justify-center gap-1.5 px-3 py-3 bg-emerald-600 disabled:opacity-45 text-white font-black rounded-md text-[10px] uppercase tracking-wider"
        >
          {submitting ? "Saving…" : isEdit ? "Save" : "Publish"}
          {!submitting && <Check size={14} aria-hidden />}
        </button>
      </div>
    </div>
  ) : null;

  const formBottomPadding = useMobileDock
    ? "max-lg:pb-[calc(6.25rem+env(safe-area-inset-bottom))]"
    : "";

  return (
    <>
    {/* Smart Fill — paste dealer text (outside form to avoid interference) */}
    <div className="mb-4 border border-zinc-700 rounded-lg p-4 sm:p-5 bg-zinc-900">
      <button type="button" onClick={() => setSmartFillOpen((o) => !o)}
        className="flex items-center justify-between w-full text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400 hover:text-zinc-200 transition-colors"
      >
        <span className="inline-flex items-center gap-2">
          <Sparkles size={14} className="text-purple-400" />
          Smart Fill — paste dealer text
        </span>
        <ChevronRight size={14} className={`transition-transform ${smartFillOpen ? "rotate-90" : ""} text-zinc-500`} />
      </button>
      {smartFillOpen && (
        <div className="mt-3 space-y-3">
          <textarea
            ref={parseTextareaRef}
            defaultValue=""
            rows={3}
            placeholder={"Paste the dealer's description here — e.g.\n2019 Toyota Axio NKT 1.5L, KSh 2,800,000, 78,000 km, petrol, automatic, white, Nairobi"}
            className="w-full border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white bg-zinc-950 outline-none focus:border-purple-500/50 transition-all resize-y min-h-[4rem] placeholder:text-zinc-600"
          />
          <div className="flex items-center gap-3">
            <button type="button" onClick={handleSmartFill} disabled={parsing}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-md bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {parsing ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Sparkles size={12} />
              )}
              {parsing ? "Parsing..." : "Parse & Fill"}
            </button>
            {parseResult && parseResult.data && (
              <span className="text-[10px] font-semibold text-zinc-500">
                Found: {Object.entries(parseResult.data.confidence)
                  .filter(([, v]) => v >= 0.4)
                  .map(([k]) => k)
                  .join(", ") || "nothing"}
                {parseResult.aiUsed ? " (AI boosted)" : ""}
              </span>
            )}
          </div>
        </div>
      )}
    </div>

    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className={`relative w-full min-w-0 max-w-none space-y-4 sm:space-y-6 animate-in fade-in duration-700 ${formBottomPadding}`}
    >
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

      {useMobileDock ? (
          <div
            className="lg:hidden sticky top-0 z-[15] -mx-3 mb-2 flex gap-1.5 overflow-x-auto border-b border-zinc-800 bg-zinc-950/95 px-3 py-2.5 backdrop-blur-sm [scrollbar-width:none]"
            aria-label="Jump to section"
          >
            {[
              { id: "portal-car-photos", label: "Photos" },
              { id: "portal-car-listing", label: "Listing" },
              { id: "car-pricing", label: "Pricing" },
              { id: "car-engine", label: "Engine" },
              { id: "car-body", label: "Body" },
              { id: "car-usage", label: "Usage" },
              { id: "car-description", label: "Details" },
              { id: "portal-car-preview", label: "Preview" },
            ].map(({ id, label }) => (
              <button key={id} type="button" onClick={() => scrollToSection(id)}
                className="shrink-0 rounded bg-zinc-800 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider text-zinc-300"
              >
                {label}
              </button>
            ))}
          </div>
      ) : null}

      <div className="space-y-4 sm:space-y-5">

        {/* Photos — moved to the very top */}
        <div id="portal-car-photos" className="scroll-mt-28 md:scroll-mt-8">
          <div className="border border-dashed border-zinc-700 rounded-lg p-4 sm:p-6 bg-zinc-900">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400 mb-3">Photos</p>
            {uploading && (
              <div className="mb-6 text-center">
                <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm font-bold text-white">Uploading...</p>
                <p className="text-xs text-zinc-500 mt-1">{uploadProgress.done} of {uploadProgress.total}</p>
              </div>
            )}
            <div>
              <MediaUploader initialImages={images} onFilesSelected={handleFilesSelected} maxFiles={15} />
            </div>
          </div>
        </div>

        {/* Identity */}
        <div id="portal-car-listing" className="scroll-mt-28 md:scroll-mt-8">
          <div className="border border-zinc-700 rounded-lg p-4 sm:p-5 bg-zinc-900">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400 mb-3">Listing</p>
            <div className="flex gap-2 mb-4">
              {Object.entries(VEHICLE_TYPE_LABELS).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setVehicleType(value)}
                  className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-md border transition-all ${
                    vehicleType === value
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                      : "border-zinc-700 text-zinc-400"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <InfieldGroup label="Make" required>
                  <input name="make" list="make-list" required defaultValue={formSeed.make} placeholder="e.g. Toyota" className={inField}
                    onChange={(e) => {
                      const nextMake = e.target.value.trim();
                      if (nextMake.toLowerCase() !== selectedMake.trim().toLowerCase()) {
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
                  <input name="model" list="model-list" required defaultValue={formSeed.model}
                    placeholder={selectedMake || "Model"} className={inField}
                    onChange={(e) => {
                      const nextModel = e.target.value.trim();
                      if (nextModel.toLowerCase() !== selectedModel.trim().toLowerCase()) {
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
              </div>
              <div>
                <InfieldGroup label="Variant">
                  <input name="variant" list="variant-list" defaultValue={formSeed.variant}
                    placeholder="Trim / grade" className={inField}
                    onChange={(e) => setVariantValue(e.target.value.trim())}
                  />
                </InfieldGroup>
                <datalist id="variant-list">
                  {variantOptions.map((variant) => <option key={variant} value={variant} />)}
                </datalist>
              </div>
              <InfieldGroup label="Year" required>
                <select name="year" defaultValue={formSeed.year} required className={inFieldSelect}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  {years.map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
              </InfieldGroup>
              <InfieldGroup label="Location">
                <input name="location" defaultValue={formSeed.location} placeholder="e.g. Nairobi, Westlands" className={inField} />
              </InfieldGroup>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div id="car-pricing" className="border border-zinc-700 rounded-lg p-4 sm:p-5 bg-zinc-900">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400 mb-3">Pricing</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <InfieldGroup label="Price (KES)">
              <input key={`price-${car?.id ?? "new"}-${formInstanceKey}`} name="price" type="text" inputMode="text"
                autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} enterKeyHint="done"
                defaultValue={(car?.price ?? formSeed.price) != null && (car?.price ?? formSeed.price) !== "" ? String(car?.price ?? formSeed.price) : ""}
                placeholder="e.g. 2,500,000" className={inField}
              />
            </InfieldGroup>
            <InfieldGroup label="Condition" required>
              <select name="condition" defaultValue={formSeed.condition} required className={inFieldSelect}>
                {CONDITIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </InfieldGroup>
            <InfieldGroup label="Mileage (km)">
              <input name="mileage" type="number" inputMode="numeric" defaultValue={formSeed.mileage} placeholder="52,000" className={inField} />
            </InfieldGroup>
            <InfieldGroup label="Transmission" required>
              <select name="transmission" defaultValue={formSeed.transmission} required className={inFieldSelect}>
                {Object.entries(TRANSMISSION_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </InfieldGroup>
          </div>
        </div>

        {/* Engine & Drivetrain */}
        <div id="car-engine" className="border border-zinc-700 rounded-lg p-4 sm:p-5 bg-zinc-900">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400 mb-3">Engine &amp; Drivetrain</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <InfieldGroup label="Fuel" required>
              <select name="fuelType" defaultValue={formSeed.fuelType} required className={inFieldSelect}>
                {Object.entries(FUEL_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </InfieldGroup>
            <InfieldGroup label="Engine (CC)">
              <input name="engineCC" type="number" inputMode="numeric"
                defaultValue={formSeed.engineCC != null && formSeed.engineCC !== "" ? String(formSeed.engineCC) : ""}
                placeholder="e.g. 2000" className={inField}
              />
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
            <InfieldGroup label="Drivetrain">
              <select name="drivetrain" defaultValue={formSeed.drivetrain || ""} className={inFieldSelect}>
                <option value="">Select</option>
                {Object.entries(DRIVETRAIN_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </InfieldGroup>
            <div className="flex items-end pb-2 gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="turbo" defaultChecked={!!formSeed.turbo} className="w-4 h-4 accent-emerald-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Turbo</span>
              </label>
            </div>
          </div>
        </div>

        {/* Body & Dimensions */}
        <div id="car-body" className="border border-zinc-700 rounded-lg p-4 sm:p-5 bg-zinc-900">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400 mb-3">Body &amp; Dimensions</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <InfieldGroup label="Body type" required>
              <select name="bodyType" defaultValue={formSeed.bodyType} required className={inFieldSelect}>
                {Object.entries(BODY_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </InfieldGroup>
            <InfieldGroup label="Color" required>
              <input name="color" required defaultValue={formSeed.color} placeholder="e.g. Pearl white" className={inField} />
            </InfieldGroup>
            <InfieldGroup label="Steering">
              <select name="steering" defaultValue={formSeed.steering} className={inFieldSelect}>
                {Object.entries(STEERING_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </InfieldGroup>
            <InfieldGroup label="Ground clearance">
              <input name="groundClearanceMm" type="number" inputMode="numeric" defaultValue={formSeed.groundClearanceMm} placeholder="195 mm" className={inField} />
            </InfieldGroup>
            <InfieldGroup label="Seats">
              <input name="seats" type="number" inputMode="numeric" defaultValue={formSeed.seats} placeholder="5" className={inField} />
            </InfieldGroup>
            <InfieldGroup label="Airbags">
              <input name="airbags" type="number" inputMode="numeric" defaultValue={formSeed.airbags} placeholder="6" className={inField} />
            </InfieldGroup>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="sunroof" defaultChecked={!!formSeed.sunroof} className="w-4 h-4 accent-emerald-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Sunroof</span>
              </label>
            </div>
          </div>
        </div>

        {/* Usage & Registration */}
        <div id="car-usage" className="border border-zinc-700 rounded-lg p-4 sm:p-5 bg-zinc-900">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400 mb-3">Usage &amp; Registration</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <InfieldGroup label="Kenya reg" required>
              <select name="registered" defaultValue={formSeed.registered == null ? "" : formSeed.registered ? "true" : "false"} required className={inFieldSelect}>
                <option value="" disabled>Select</option>
                <option value="true">Registered</option>
                <option value="false">Not registered</option>
              </select>
            </InfieldGroup>
            <InfieldGroup label="Origin">
              <select name="imported" defaultValue={formSeed.imported == null ? "" : formSeed.imported ? "true" : "false"} className={inFieldSelect}>
                <option value="" disabled>Select</option>
                <option value="false">Locally used</option>
                <option value="true">Foreign used (imported)</option>
              </select>
            </InfieldGroup>
            <InfieldGroup label="Import country">
              <select name="importCountry" defaultValue={formSeed.importCountry || ""} className={inFieldSelect}>
                <option value="">Select</option>
                <option value="Japan">Japan</option>
                <option value="UK">UK</option>
                <option value="USA">USA</option>
                <option value="UAE">UAE</option>
                <option value="Germany">Germany</option>
                <option value="South Africa">South Africa</option>
                <option value="Thailand">Thailand</option>
                <option value="Singapore">Singapore</option>
                <option value="Other">Other</option>
              </select>
            </InfieldGroup>
            <InfieldGroup label="Car Location">
              <select name="carStatus" defaultValue={formSeed.carStatus} className={inFieldSelect}>
                <option value="">Select</option>
                {Object.entries(CAR_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </InfieldGroup>
          </div>
        </div>

        {/* Description */}
        <div id="car-description" className="border border-zinc-700 rounded-lg p-4 sm:p-5 bg-zinc-900 space-y-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400 mb-2">Description</p>
            <textarea name="description" rows={4} defaultValue={formSeed.description}
              placeholder="Condition, service history, tyres, known issues…"
              className="w-full border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white bg-zinc-950 outline-none focus:border-emerald-500/50 transition-all resize-y min-h-[6rem] placeholder:text-zinc-600"
            />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400 mb-2">Features</p>
            <textarea ref={featuresTextareaRef} data-field="features"
              key={`features-${car?.id ?? "new"}-${formInstanceKey}`}
              defaultValue={initialFeaturesDisplay} onInput={bumpFeaturesInput} rows={2}
              placeholder="Leather seats, Sunroof, Reverse camera…"
              className="w-full border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white bg-zinc-950 outline-none focus:border-emerald-500/50 transition-all resize-y min-h-[3.5rem] placeholder:text-zinc-600"
            />
            <p className="mt-1.5 text-[10px] text-zinc-500">{parsedFeatures.length} feature{parsedFeatures.length === 1 ? "" : "s"} — comma-separated</p>
            {parsedFeatures.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {parsedFeatures.map((f, i) => (
                  <span key={i} className="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-[10px] font-semibold text-zinc-300">
                    {f}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Preview */}
        <div id="portal-car-preview" className="scroll-mt-28 md:scroll-mt-8">
          <div className="border border-zinc-700 rounded-lg p-4 sm:p-5 bg-zinc-900">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Preview</p>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <div className="flex h-20 w-full shrink-0 items-center justify-center overflow-hidden rounded bg-zinc-800 sm:h-24 sm:w-36">
                {previewCoverSrc ? (
                  <img src={previewCoverSrc} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] text-zinc-500 font-semibold">No photo</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black text-white truncate">{previewTitle}</p>
                {previewVariant && <p className="text-xs font-semibold text-zinc-500 truncate">{previewVariant}</p>}
                <p className="text-sm font-bold text-emerald-400 mt-1">{previewPrice ? `KES ${Number(previewPrice).toLocaleString("en-KE")}` : "Contact for price"}</p>
                <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{previewDescription || "—"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop publish bar */}
        <div className="hidden lg:flex items-center justify-between gap-3 pt-4 border-t border-zinc-700">
          <a href={mobileCancelHref} className="px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-zinc-500 hover:text-white transition-colors">
            Cancel
          </a>
          <button type="submit" disabled={publishBlocked}
            title={publishBlocked && !submitting && !uploading ? "Complete required fields" : undefined}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-45 disabled:cursor-not-allowed text-white font-black rounded-md text-[11px] uppercase tracking-wider inline-flex items-center gap-2"
          >
            {submitting ? "Saving..." : isEdit ? "Save" : "Publish"}
            {!submitting && <Check size={15} />}
          </button>
        </div>
      </div>

      {mobileDock}
    </form>
    </>
    );
  }

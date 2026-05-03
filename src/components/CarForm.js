"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronRight, Info, Sparkles } from "lucide-react";
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

const FEATURE_CHECKLIST = [
  "Reverse Camera", "360 Camera", "Parking Sensors", "Lane Assist", "Blind Spot Monitor",
  "Adaptive Cruise Control", "Apple CarPlay", "Android Auto", "Navigation", "Bluetooth",
  "Push Start", "Keyless Entry", "Leather Seats", "Electric Seats", "Heated Seats",
  "Cooled Seats", "Sunroof", "Panoramic Roof", "LED Headlights", "Fog Lights",
  "Alloy Wheels", "Power Tailgate", "Dual Zone AC", "Rear AC", "Climate Control",
  "ABS", "Airbags", "Traction Control", "Stability Control", "Hill Assist",
  "4WD", "AWD", "Turbo", "Hybrid", "Diesel", "Petrol", "Roof Rails",
  "Tow Bar", "Bull Bar", "Side Steps", "Spare Key", "Service History",
  "One Owner", "Accident Free", "Low Mileage", "New Tyres", "Touch Screen",
  "Premium Sound", "Steering Controls", "Heads-Up Display", "Wireless Charging",
  "Ambient Lighting", "Digital Cluster", "Auto Headlights", "Auto Wipers",
  "Collision Warning", "Emergency Braking", "Tyre Pressure Monitor", "USB Ports",
  "Memory Seats", "Power Mirrors", "Fold Mirrors", "Dash Cam", "Immobilizer",
  "Alarm System", "Child Lock", "ISOFIX", "Tinted Windows", "Rear Spoiler",
].sort((a, b) => a.localeCompare(b));

/** Digits-only string (e.g. normalizing API numbers). */
function normalizePriceDigits(value) {
  return String(value ?? "").replace(/[^\d]/g, "");
}

/**
 * Normalizes dealer-entered price to whole KES string: supports commas, KSh prefix, and 3.2M-style millions.
 */
function normalizePriceToIntegerString(raw) {
  let s = String(raw ?? "").trim();
  if (!s) return "";
  s = s.replace(/,/g, "").replace(/\s+/g, "");
  s = s.replace(/^ksh/i, "").replace(/^kes/i, "").trim();
  const mSuffix = s.match(/^([\d.]+)[mM]$/);
  if (mSuffix) {
    const n = parseFloat(mSuffix[1]);
    if (Number.isFinite(n) && n >= 0) return String(Math.round(n * 1_000_000));
  }
  return s.replace(/[^\d]/g, "");
}

/** DOM snapshot with authoritative controlled price (avoids React/DOM desync). */
function collectFormSnapshot(form, priceInputStr) {
  if (!form) return {};
  return { ...collectFormValues(form), price: priceInputStr == null ? "" : String(priceInputStr) };
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
    drivetrain: car?.drivetrain || "FWD",
    steering: car?.steering || "RHD",
    airbags: car?.airbags || "",
    seats: car?.seats || "",
    color: car?.color || "",
    description: car?.description || "",
    negotiable: car?.negotiable ?? true,
    imported: car?.imported ?? true,
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

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
  const [images, setImages] = useState(
    car?.images?.map((img) => ({ url: img.url, isPrimary: img.isPrimary })) || []
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const badges = useMemo(() => car?.badges || [], [car]);
  const [priceInput, setPriceInput] = useState(() =>
    normalizePriceToIntegerString(formSeed.price ?? "")
  );
  /** Keeps latest price for form-level listeners (same tick as input); avoids stale closure vs controlled field. */
  const priceInputRef = useRef(priceInput);
  useEffect(() => {
    priceInputRef.current = priceInput;
  }, [priceInput]);
  const [selectedFeatures, setSelectedFeatures] = useState(car?.features || []);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [customFeature, setCustomFeature] = useState("");
  const [draftLoaded, setDraftLoaded] = useState(false);
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
  const [smartFillDraft, setSmartFillDraft] = useState("");
  const [parsing, setParsing] = useState(false);
  const [smartFillMeta, setSmartFillMeta] = useState({
    source: "rules",
    confidence: {},
    overall: null,
    warnings: [],
  });
  const [smartFillDiff, setSmartFillDiff] = useState([]);
  const [descriptionTouched, setDescriptionTouched] = useState(Boolean((formSeed.description || "").trim()));
  const [liveDraft, setLiveDraft] = useState({});

  const formRef = useRef(null);
  const initializedNewFormRef = useRef(false);
  const smartFillInputRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const uploadedLocalMapRef = useRef(new Map());
  const pendingUploadIdsRef = useRef(new Set());
  const featureOptions = useMemo(
    () => Array.from(new Set([...FEATURE_CHECKLIST, ...selectedFeatures])).sort((a, b) => a.localeCompare(b)),
    [selectedFeatures]
  );

  const inputCls = "w-full bg-[#fbfcfe] dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-[#ff5a2f] transition-all";
  const selectCls = "w-full bg-[#fbfcfe] dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-[#ff5a2f] transition-all appearance-none";
  const labelCls = "block text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1 mb-2";
  const confidenceClass = (fieldName) => {
    const score = Number(smartFillMeta?.confidence?.[fieldName] ?? 0);
    if (!score) return "";
    if (score < 0.6) return " border-amber-400 ring-2 ring-amber-100 dark:ring-amber-900/30";
    return " border-emerald-500/60";
  };
  const previewTitle = `${liveDraft.year || selectedYear || ""} ${liveDraft.make || selectedMake || ""} ${liveDraft.model || selectedModel || ""}`.trim() || "Your listing preview";
  const previewVariant = liveDraft.variant || "";
  const previewDescription = String(liveDraft.description || formSeed.description || "").trim();
  const previewPrice = priceInput || liveDraft.price || "";
  const saveDraft = useCallback(() => {
    if (!draftKey || !isNew || !formRef.current) return;

    const fields = collectFormSnapshot(formRef.current, priceInput);
    localStorage.setItem(
      draftKey,
      JSON.stringify({
        fields,
        images,
        badges,
        selectedFeatures,
        updatedAt: Date.now(),
      })
    );
  }, [draftKey, images, isNew, priceInput, selectedFeatures, badges]);

  useEffect(() => {
    if (!isNew) return;
    if (initializedNewFormRef.current) return;
    initializedNewFormRef.current = true;
    if (draftKey) localStorage.removeItem(draftKey);
    localStorage.removeItem(defaultsKey);
    setDraftLoaded(false);
    setFormSeed(baseSeed);
    setImages([]);
    setSelectedFeatures([]);
    const nextPrice = normalizePriceToIntegerString(baseSeed.price ?? "");
    priceInputRef.current = nextPrice;
    setPriceInput(nextPrice);
  }, [baseSeed, defaultsKey, draftKey, isNew]);

  useEffect(() => {
    if (!isNew) {
      const nextPrice = normalizePriceToIntegerString(car?.price ?? "");
      priceInputRef.current = nextPrice;
      setPriceInput(nextPrice);
      return;
    }
    if (car?.id) {
      const nextPrice = normalizePriceToIntegerString(car?.price ?? "");
      priceInputRef.current = nextPrice;
      setPriceInput(nextPrice);
    }
  }, [isNew, car?.id, car?.price]);

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
  }, [images, selectedFeatures, isNew, saveDraft]);

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

    const updateLiveDraft = () => setLiveDraft(collectFormSnapshot(form, priceInputRef.current));
    updateLiveDraft();
    form.addEventListener("input", updateLiveDraft);
    form.addEventListener("change", updateLiveDraft);
    return () => {
      form.removeEventListener("input", updateLiveDraft);
      form.removeEventListener("change", updateLiveDraft);
    };
  }, [images, priceInput, selectedFeatures]);

  const applyDetectedValuesToForm = useCallback((seeded) => {
    const form = formRef.current;
    if (!form) return;
    const setField = (selector, value) => {
      if (value === null || value === undefined || value === "") return;
      const field = form.querySelector(selector);
      if (!field) return;
      field.value = value ?? "";
      field.dispatchEvent(new Event("input", { bubbles: true }));
      field.dispatchEvent(new Event("change", { bubbles: true }));
    };
    setField('input[name="make"]', seeded.make);
    setField('input[name="model"]', seeded.model);
    setField('input[name="variant"]', seeded.variant);
    setField('select[name="year"]', seeded.year ? String(seeded.year) : "");
    setField('input[name="mileage"]', seeded.mileage ? String(seeded.mileage) : "");
    setField('input[name="engineCC"]', seeded.engineCC ? String(seeded.engineCC) : "");
    setField('select[name="bodyType"]', seeded.bodyType || "");
  }, []);

  const applyGeneratedDescription = useCallback((force = false) => {
    if (descriptionTouched && !force) return;
    const values = { ...liveDraft, make: selectedMake || liveDraft.make, model: selectedModel || liveDraft.model, year: selectedYear || liveDraft.year };
    const generated = buildAutoDescription(values, selectedFeatures);
    const form = formRef.current;
    const field = form?.querySelector('textarea[name="description"]');
    if (field) {
      field.value = generated;
      field.dispatchEvent(new Event("input", { bubbles: true }));
      field.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }, [descriptionTouched, liveDraft, selectedFeatures, selectedMake, selectedModel, selectedYear]);

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

  function toggleFeature(feature) {
    setSelectedFeatures((prev) =>
      prev.includes(feature) ? prev.filter((f) => f !== feature) : [...prev, feature]
    );
  }

  function addCustomFeature() {
    const clean = customFeature.trim();
    if (!clean) return;
    setSelectedFeatures((prev) => {
      const exists = prev.some((f) => f.toLowerCase() === clean.toLowerCase());
      return exists ? prev : [...prev, clean];
    });
    setCustomFeature("");
  }

  function clearDraft() {
    if (!draftKey) return;
    localStorage.removeItem(draftKey);
    setDraftLoaded(false);
  }


  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());

    data.images = images;
    data.features = selectedFeatures;
    data.badges = badges;

    data.year = parseInt(data.year, 10);

    const priceDigits = normalizePriceToIntegerString(priceInput);
    data.price = parseInt(priceDigits, 10);
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
        setDraftLoaded(false);
      }
      
      window.location.href = result.redirectTo || (isPortal ? "/portal" : "/admin/cars");
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  const handleSmartFill = async () => {
    const rawSmartFill = smartFillInputRef.current?.value || "";
    if (!rawSmartFill.trim()) return;
    setParsing(true);
    setError("");
    setSmartFillMeta({ source: "rules", confidence: {}, overall: null, warnings: [] });

    try {
      const response = await fetch("/api/cars/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: rawSmartFill }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "Smart Fill service failed");
      }

      const parsed = payload?.data || {};
      const confidence = parsed?.confidence || {};

      setSmartFillMeta({
        source: parsed?.source || (payload?.aiUsed ? "llm+rules" : "rules"),
        confidence,
        overall: typeof payload?.confidenceScore === "number" ? payload.confidenceScore : null,
        warnings: Array.isArray(parsed?.warnings) ? parsed.warnings : [],
      });

      const nextFeatures = [];
      const lowerText = rawSmartFill.toLowerCase();
      FEATURE_CHECKLIST.forEach((feature) => {
        const featureLower = feature.toLowerCase();
        if (lowerText.includes(featureLower)) nextFeatures.push(feature);
      });
      if (nextFeatures.length) setSelectedFeatures(Array.from(new Set([...selectedFeatures, ...nextFeatures])));

      const seeded = {
        make: parsed?.make || "",
        model: parsed?.model || "",
        variant: parsed?.variant || "",
        year: parsed?.year || "",
        price: parsed?.price || "",
        mileage: parsed?.mileage || "",
        engineCC: parsed?.engineCC || "",
        bodyType: parsed?.bodyType || "",
      };

      const currentValues = collectFormSnapshot(formRef.current, priceInput);
      const fieldLabels = {
        make: "Make",
        model: "Model",
        variant: "Variant",
        year: "Year",
        price: "Price",
        mileage: "Mileage",
        engineCC: "Engine CC",
        bodyType: "Body Type",
      };
      const diff = [];
      Object.entries(seeded).forEach(([field, nextValue]) => {
        if (nextValue === "" || nextValue === null || nextValue === undefined) return;
        const prevValue = currentValues[field] ?? "";
        if (String(prevValue) !== String(nextValue)) {
          diff.push({
            field,
            label: fieldLabels[field] || field,
            from: String(prevValue || "empty"),
            to: String(nextValue),
            confidence: Number(confidence[field] || 0),
          });
        }
      });

      setSmartFillDiff(diff);

      const currentMake = formRef.current?.querySelector('input[name="make"]')?.value?.trim() || selectedMake;
      const currentModel = formRef.current?.querySelector('input[name="model"]')?.value?.trim() || selectedModel;
      const currentYear = formRef.current?.querySelector('select[name="year"]')?.value?.trim() || selectedYear;
      setSelectedYear(seeded.year ? String(seeded.year) : currentYear);
      setSelectedMake(seeded.make || currentMake);
      setSelectedModel(seeded.model || currentModel);
      if (seeded.price) {
        const nextPrice = normalizePriceToIntegerString(String(seeded.price));
        priceInputRef.current = nextPrice;
        setPriceInput(nextPrice);
      }
      applyDetectedValuesToForm(seeded);

      if (!seeded.make && !seeded.model && !seeded.price && !seeded.mileage && !seeded.year) {
        setError("No key fields detected. Try adding year, make, model, price, and mileage in the text.");
      }
    } catch (err) {
      console.error("Smart Fill Error:", err);
      setError("Failed to parse some details. Please review fields manually.");
    } finally {
      setParsing(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 animate-in fade-in duration-700">
      {isNew && (
        <div className="bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-1 sm:mb-1.5">
            <Sparkles size={14} className="text-indigo-500 shrink-0 sm:w-4 sm:h-4" />
            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">Smart Fill</h3>
          </div>
          <p className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
            Paste ad or WhatsApp text — we fill year, make, model, price, mileage, and more.
          </p>
          <div className="space-y-2 sm:space-y-2.5">
            <textarea
              ref={smartFillInputRef}
              defaultValue=""
              onInput={(e) => setSmartFillDraft(e.currentTarget.value || "")}
              placeholder="2017 RAV4, 45k km, 3.2M…"
              className="w-full min-h-[5.25rem] sm:min-h-[6.5rem] bg-[#fbfcfe] dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-indigo-500 transition-all resize-y"
            />
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSmartFill}
                disabled={parsing || !smartFillDraft.trim()}
                className="px-3 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold uppercase tracking-wider rounded-xl text-[10px] sm:text-xs transition-all inline-flex items-center gap-1.5"
              >
                {parsing ? "…" : "Apply"}
                {!parsing && <Sparkles size={14} />}
              </button>
              {smartFillDraft && (
                <button
                  type="button"
                  onClick={() => {
                    if (smartFillInputRef.current) smartFillInputRef.current.value = "";
                    setSmartFillDraft("");
                  }}
                  className="text-[10px] sm:text-xs font-bold text-slate-500 hover:text-rose-600 uppercase tracking-wider px-2"
                >
                  Clear
                </button>
              )}
            </div>
            <p className="hidden sm:block text-[10px] text-emerald-800 font-medium rounded-lg border border-emerald-200 bg-emerald-50/80 px-2.5 py-1.5">
              Run again anytime; every field stays editable.
            </p>
            {(smartFillMeta.overall !== null || smartFillMeta.warnings.length > 0) && (
              <div className="rounded-lg border border-indigo-200 dark:border-zinc-700 bg-white/60 dark:bg-zinc-900/40 px-2.5 py-2 text-[10px] sm:text-[11px]">
                <p className="font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  {smartFillMeta.source}
                  {smartFillMeta.overall !== null ? ` · ${(smartFillMeta.overall * 100).toFixed(0)}%` : ""}
                </p>
                {smartFillMeta.warnings.length > 0 && (
                  <p className="mt-1 font-semibold text-amber-700 dark:text-amber-300">{smartFillMeta.warnings.join(", ")}</p>
                )}
              </div>
            )}
            {smartFillDiff.length > 0 && (
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-[#fbfcfe] dark:bg-[#0f0f10] px-2.5 py-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Changes</p>
                <div className="space-y-0.5">
                  {smartFillDiff.slice(0, 5).map((d) => (
                    <p key={d.field} className="text-[10px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {d.label}: <span className="line-through text-slate-400">{d.from}</span> → <span className="text-slate-900 dark:text-white">{d.to}</span>
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-black uppercase tracking-widest rounded-xl sm:rounded-2xl px-4 py-3 sm:px-6 sm:py-4 flex items-center gap-3">
          <Info size={16} />
          {error}
        </div>
      )}

      {dealers.length > 1 && (
        <div className="bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl p-6 sm:p-8">
          <label className={labelCls}>Assigned Dealer *</label>
          <select
            name="dealerId"
            defaultValue={formSeed.dealerId || ""}
            required
            className={selectCls}
            onChange={(e) => setSelectedDealerId(e.target.value)}
          >
            <option value="">Select dealer</option>
            {dealers.map((dealer) => (
              <option key={dealer.id} value={dealer.id}>{dealer.name} - {dealer.location}</option>
            ))}
          </select>
        </div>
      )}
      {dealers.length === 1 && dealers[0] && <input type="hidden" name="dealerId" value={dealers[0].id} />}

      <div className="space-y-5 sm:space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1.5 h-1.5 rounded-2xl bg-[#ff5a2f]" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Vehicle Basics</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Make *</label>
              <input
                name="make"
                list="make-list"
                required
                defaultValue={formSeed.make}
                placeholder="e.g. Toyota"
                className={`${inputCls}${confidenceClass("make")}`}
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
              <datalist id="make-list">
                {MAKES.map((make) => <option key={make} value={make} />)}
              </datalist>
            </div>
            <div>
              <label className={labelCls}>Model *</label>
              <input
                name="model"
                list="model-list"
                required
                defaultValue={formSeed.model}
                placeholder={selectedMake ? `Type or pick a ${selectedMake} model` : "Pick make first or type model"}
                className={`${inputCls}${confidenceClass("model")}`}
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
              <datalist id="model-list">
                {modelOptions.map((model) => <option key={model} value={model} />)}
              </datalist>
              <p className="mt-1 text-[11px] font-semibold text-slate-500">
                {selectedMake
                  ? loadingModels
                    ? "Loading model suggestions..."
                    : modelOptions.length > 0
                      ? `${modelOptions.length} model suggestion(s) for ${selectedMake}${modelSources.includes("vpic") ? " (inventory + internet)" : ""}`
                      : `No model suggestions found for ${selectedMake} yet. You can still type manually.`
                  : "Choose a make to get matching model suggestions."}
              </p>
            </div>
            <div>
              <label className={labelCls}>Variant</label>
              <input
                name="variant"
                list="variant-list"
                defaultValue={formSeed.variant}
                placeholder={selectedModel ? `Type or pick a ${selectedModel} variant` : "Pick model first or type variant"}
                className={`${inputCls}${confidenceClass("variant")}`}
              />
              <datalist id="variant-list">
                {variantOptions.map((variant) => <option key={variant} value={variant} />)}
              </datalist>
              <p className="mt-1 text-[11px] font-semibold text-slate-500">
                {selectedMake && selectedModel
                  ? loadingVariants
                    ? "Loading variant suggestions..."
                    : variantOptions.length > 0
                      ? `${variantOptions.length} variant suggestion(s) for ${selectedMake} ${selectedModel}${variantSources.some((source) => source !== "inventory") ? " (inventory + internet)" : ""}`
                      : `No variant suggestions found for ${selectedMake} ${selectedModel} yet. You can still type manually.`
                  : "Choose make and model to get matching variant suggestions."}
              </p>
            </div>

            <div>
              <label className={labelCls}>Year *</label>
              <select
                name="year"
                defaultValue={formSeed.year}
                required
                className={`${selectCls}${confidenceClass("year")}`}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                {years.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Condition *</label>
              <select name="condition" defaultValue={formSeed.condition} required className={selectCls}>
                {CONDITIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Price (KES) *</label>
              <input
                name="price"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                enterKeyHint="done"
                required
                value={priceInput}
                onChange={(e) => {
                  const v = e.target.value;
                  priceInputRef.current = v;
                  setPriceInput(v);
                }}
                onBlur={(e) => {
                  const normalized = normalizePriceToIntegerString(e.target.value);
                  priceInputRef.current = normalized;
                  setPriceInput(normalized);
                }}
                placeholder="e.g. 2500000 or 3.2M"
                className={`${inputCls} text-base sm:text-sm min-h-[48px]${confidenceClass("price")}`}
              />
              <p className="mt-1 text-[11px] font-semibold text-slate-500">
                Whole shillings only. You can type plain digits, use commas, or millions like 3.2M — we tidy the field
                when you leave the box. Smart Fill can always update price; edit again anytime after.
              </p>
            </div>

            <div>
              <label className={labelCls}>Mileage (km)</label>
              <input name="mileage" type="number" defaultValue={formSeed.mileage} placeholder="e.g. 52000" className={`${inputCls}${confidenceClass("mileage")}`} />
            </div>
            <div>
              <label className={labelCls}>Fuel *</label>
              <select name="fuelType" defaultValue={formSeed.fuelType} required className={selectCls}>
                {Object.entries(FUEL_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Transmission *</label>
              <select name="transmission" defaultValue={formSeed.transmission} required className={selectCls}>
                {Object.entries(TRANSMISSION_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Color *</label>
              <input name="color" required defaultValue={formSeed.color} placeholder="e.g. Pearl White" className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Body Type *</label>
              <select name="bodyType" defaultValue={formSeed.bodyType} required className={selectCls}>
                {Object.entries(BODY_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Drivetrain</label>
              <select name="drivetrain" defaultValue={formSeed.drivetrain} className={selectCls}>
                {Object.entries(DRIVETRAIN_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Steering</label>
              <select name="steering" defaultValue={formSeed.steering} className={selectCls}>
                {Object.entries(STEERING_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-2xl bg-[#ff5a2f]" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Photos</h3>
              </div>
            </div>
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
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-1.5 h-1.5 rounded-2xl bg-purple-500" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Description</h3>
                </div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => applyGeneratedDescription(true)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider"
                  >
                    Generate from specs
                  </button>
                </div>
                <textarea
                  name="description"
                  rows={5}
                  defaultValue={formSeed.description}
                  onChange={(e) => {
                    setDescriptionTouched(true);
                  }}
                  placeholder="Share condition, service history, and key selling points..."
                  className={`${inputCls} resize-none`}
                />
                <p className="mt-2 text-xs font-semibold text-slate-500">
                  Keep it honest and specific: service history, owner count, accidents, tyres, and any known issue.
                </p>
              </div>
              <div className="bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Feature Checklist</p>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Tap to select car features</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#ff5a2f] bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-2xl">{selectedFeatures.length} selected</span>
                    <button
                      type="button"
                      onClick={() => setFeaturesOpen((prev) => !prev)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-[#ddd4c8] dark:border-slate-700 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                    >
                      {featuresOpen ? "Collapse" : "Expand"}
                      <ChevronRight size={14} className={`transition-transform ${featuresOpen ? "rotate-90" : ""}`} />
                    </button>
                  </div>
                </div>
                {featuresOpen ? (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5">
                      {featureOptions.map((feature) => {
                        const active = selectedFeatures.includes(feature);
                        return (
                          <button
                            key={feature}
                            type="button"
                            onClick={() => toggleFeature(feature)}
                            className={`text-left text-[11px] font-bold px-3 py-2.5 rounded-2xl border transition-all ${
                              active ? "bg-[#ff5a2f] text-slate-900 dark:text-white border-[#ff5a2f]" : "bg-[#fbfcfe] dark:bg-[#111111] text-slate-700 border-[#ddd4c8] dark:border-slate-800 hover:bg-slate-100"
                            }`}
                          >
                            {feature}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-4 flex flex-col sm:flex-row gap-2">
                      <input
                        value={customFeature}
                        onChange={(e) => setCustomFeature(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addCustomFeature();
                          }
                        }}
                        placeholder="Add custom feature"
                        className={inputCls}
                      />
                      <button type="button" onClick={addCustomFeature} className="px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-black uppercase tracking-wider">
                        Add Feature
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-xs font-semibold text-slate-500">
                    Feature list collapsed to save space. Expand to choose standard or custom features.
                  </p>
                )}
                {selectedFeatures.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedFeatures.map((feature) => (
                      <button
                        key={`selected-${feature}`}
                        type="button"
                        onClick={() => toggleFeature(feature)}
                        className="px-3 py-1.5 rounded-2xl border border-[#ff5a2f] bg-[#ff5a2f]/10 text-[11px] font-bold text-slate-700 dark:text-slate-200"
                      >
                        {feature} x
                      </button>
                    ))}
                  </div>
                )}
              </div>
            <div className="bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                  <Sparkles size={16} className="text-amber-500" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Advanced Specs</h3>
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className={labelCls}>Engine CC</label>
                    <input name="engineCC" type="number" defaultValue={formSeed.engineCC} placeholder="e.g. 2000" className={`${inputCls}${confidenceClass("engineCC")}`} />
                  </div>
                  <div>
                    <label className={labelCls}>Ground Clearance (mm)</label>
                    <input name="groundClearanceMm" type="number" defaultValue={formSeed.groundClearanceMm} placeholder="e.g. 185" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Spare Availability (1-10)</label>
                    <input name="spareAvailability" type="number" min="1" max="10" defaultValue={formSeed.spareAvailability} placeholder="e.g. 8" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Hybrid Battery Tech</label>
                    <select name="hybridBatteryTech" defaultValue={formSeed.hybridBatteryTech} className={selectCls}>
                      {Object.entries(HYBRID_BATTERY_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Cylinders</label>
                    <input name="cylinders" type="number" defaultValue={formSeed.cylinders} placeholder="e.g. 4" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Horsepower</label>
                    <input name="horsepower" type="number" defaultValue={formSeed.horsepower} placeholder="e.g. 180" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Torque (Nm)</label>
                    <input name="torque" type="number" defaultValue={formSeed.torque} placeholder="e.g. 280" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Airbags</label>
                    <input name="airbags" type="number" defaultValue={formSeed.airbags} placeholder="e.g. 6" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Seats</label>
                    <input name="seats" type="number" defaultValue={formSeed.seats} placeholder="e.g. 5" className={inputCls} />
                  </div>
                  <div className="pt-8 space-y-3">
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

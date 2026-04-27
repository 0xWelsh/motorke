"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronRight, Info, Sparkles, UploadCloud } from "lucide-react";
import MediaUploader from "./admin/MediaUploader";
import {
  BADGE_OPTIONS,
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
];


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
    importEligibility: typeof car?.importEligibility === "boolean" ? String(car.importEligibility) : "",
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
    dutyPaid: car?.dutyPaid ?? true,
    imported: car?.imported ?? true,
    turbo: car?.turbo ?? false,
    sunroof: car?.sunroof ?? false,
    featured: car?.featured ?? false,
    videoUrl: car?.videoUrl || "",
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

function qualityScore(seed, images, features) {
  let score = 0;
  if (seed.make && seed.model && seed.price) score += 25;
  if (seed.year) score += 10;
  if (seed.mileage) score += 8;
  if (seed.fuelType && seed.transmission && seed.bodyType) score += 12;
  if (images.length >= 1) score += 10;
  if (images.length >= 3) score += 10;
  if (images.length >= 6) score += 5;
  if ((seed.description || "").trim().length >= 80) score += 12;
  if (features.length >= 5) score += 8;
  return Math.min(100, score);
}

export default function CarForm({ dealers = [], car = null, action, method = "POST" }) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 40 }, (_, i) => currentYear - i);

  const isEdit = method === "PUT" && !!car;
  const isPortal = action?.startsWith("/api/portal/");
  const isNew = !isEdit;
  const initialSimpleMode = isPortal && isNew;

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
  const [formVersion, setFormVersion] = useState(0);
  const [simpleMode, setSimpleMode] = useState(initialSimpleMode);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
  const [images, setImages] = useState(
    car?.images?.map((img) => ({ url: img.url, isPrimary: img.isPrimary })) || []
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [badges, setBadges] = useState(car?.badges || []);
  const [currency, setCurrency] = useState("KES");
  const EXCHANGE_RATE = 135; 
  const [priceInput, setPriceInput] = useState(formSeed.price || "");
  const [selectedFeatures, setSelectedFeatures] = useState(car?.features || []);
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
  const [smartFillText, setSmartFillText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [videoUrl, setVideoUrl] = useState(formSeed.videoUrl || "");
  const [checklist, setChecklist] = useState({
    basics: false,
    media: false,
    details: false,
    publish: false,
  });

  const formRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const uploadedLocalMapRef = useRef(new Map());
  const pendingUploadIdsRef = useRef(new Set());
  const score = qualityScore(formSeed, images, selectedFeatures);
  const checklistItems = [
    { key: "basics", label: "Basics" },
    { key: "media", label: "Photos" },
    { key: "details", label: "Details" },
    { key: "publish", label: "Ready" },
  ];
  const checklistDone = checklistItems.filter((item) => checklist[item.key]).length;

  const inputCls = "w-full bg-[#fbfcfe] dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-[#ff5a2f] transition-all";
  const selectCls = "w-full bg-[#fbfcfe] dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-[#ff5a2f] transition-all appearance-none";
  const labelCls = "block text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1 mb-2";

  const saveDraft = useCallback(() => {
    if (!draftKey || !isNew || !formRef.current) return;

    const fields = collectFormValues(formRef.current);
    localStorage.setItem(
      draftKey,
      JSON.stringify({
        fields,
        images,
        badges,
        selectedFeatures,
        simpleMode,
        updatedAt: Date.now(),
      })
    );
  }, [badges, draftKey, images, isNew, selectedFeatures, simpleMode]);

  useEffect(() => {
    if (!isNew || !formRef.current) return;

    const draftRaw = draftKey ? localStorage.getItem(draftKey) : null;
    if (draftRaw) {
      try {
        const parsed = JSON.parse(draftRaw);
        setFormSeed((prev) => ({ ...prev, ...(parsed.fields || {}) }));
        setImages(Array.isArray(parsed.images) ? parsed.images : []);
        setBadges(Array.isArray(parsed.badges) ? parsed.badges : []);
        setSelectedFeatures(Array.isArray(parsed.selectedFeatures) ? parsed.selectedFeatures : []);
        setSimpleMode(typeof parsed.simpleMode === "boolean" ? parsed.simpleMode : initialSimpleMode);
        setDraftLoaded(true);
        setFormVersion((v) => v + 1);
        return;
      } catch {
        if (draftKey) localStorage.removeItem(draftKey);
      }
    }

    const defaultsRaw = localStorage.getItem(defaultsKey);
    if (defaultsRaw) {
      try {
        const defaults = JSON.parse(defaultsRaw);
        setFormSeed((prev) => ({ ...prev, ...defaults }));
        setFormVersion((v) => v + 1);
      } catch {
        // Ignore malformed defaults
      }
    }
  }, [defaultsKey, draftKey, initialSimpleMode, isNew]);

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
  }, [images, badges, selectedFeatures, simpleMode, isNew, saveDraft]);

  useEffect(() => {
    const currentMake =
      formRef.current?.querySelector('input[name="make"]')?.value?.trim() ||
      (formSeed.make || "").trim();
    setSelectedMake(currentMake);
  }, [formVersion, formSeed.make]);

  useEffect(() => {
    const currentModel =
      formRef.current?.querySelector('input[name="model"]')?.value?.trim() ||
      (formSeed.model || "").trim();
    setSelectedModel(currentModel);
  }, [formVersion, formSeed.model]);

  useEffect(() => {
    const currentYearValue =
      formRef.current?.querySelector('select[name="year"]')?.value?.trim() ||
      String(formSeed.year || currentYear);
    setSelectedYear(currentYearValue);
  }, [currentYear, formVersion, formSeed.year]);

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

    const deriveChecklist = () => {
      const values = collectFormValues(form);
      const basicsDone =
        Boolean((values.make || "").trim()) &&
        Boolean((values.model || "").trim()) &&
        Boolean(values.year) &&
        Boolean(values.price);
      const mediaDone = images.length >= 3;
      const detailsDone =
        ((values.description || "").trim().length >= 50) || selectedFeatures.length >= 3;
      const publishDone = basicsDone && mediaDone && detailsDone;

      setChecklist({
        basics: basicsDone,
        media: mediaDone,
        details: detailsDone,
        publish: publishDone,
      });
    };

    deriveChecklist();
    form.addEventListener("input", deriveChecklist);
    form.addEventListener("change", deriveChecklist);
    return () => {
      form.removeEventListener("input", deriveChecklist);
      form.removeEventListener("change", deriveChecklist);
    };
  }, [images, selectedFeatures, formVersion]);

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
    if (!selectedFeatures.includes(clean)) setSelectedFeatures((prev) => [...prev, clean]);
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
    
    // Currency resolution: if the user inputted USD, convert to KES before saving.
    let basePrice = parseInt(data.price, 10);
    if (currency === "USD") {
      basePrice = Math.round(basePrice * EXCHANGE_RATE);
    }
    data.price = basePrice;

    data.mileage = data.mileage ? parseInt(data.mileage, 10) : null;
    data.engineCC = data.engineCC ? parseInt(data.engineCC, 10) : null;
    data.groundClearanceMm = data.groundClearanceMm ? parseInt(data.groundClearanceMm, 10) : null;
    data.spareAvailability = data.spareAvailability ? parseInt(data.spareAvailability, 10) : null;
    data.hybridBatteryTech = data.hybridBatteryTech ? data.hybridBatteryTech : null;
    data.importEligibility = data.importEligibility === "" ? null : data.importEligibility === "true";
    data.cylinders = data.cylinders ? parseInt(data.cylinders, 10) : null;
    data.horsepower = data.horsepower ? parseInt(data.horsepower, 10) : null;
    data.torque = data.torque ? parseInt(data.torque, 10) : null;
    data.airbags = data.airbags ? parseInt(data.airbags, 10) : null;
    data.seats = data.seats ? parseInt(data.seats, 10) : null;

    data.negotiable = data.negotiable === "on";
    data.dutyPaid = data.dutyPaid === "on";
    data.imported = data.imported === "on";
    data.featured = data.featured === "on";
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
          dutyPaid: data.dutyPaid,
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

  const normalizeModelToken = (token = "") =>
    token
      .replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9+-]+$/g, "")
      .trim();

  const toTitleCase = (value = "") =>
    value
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => {
        if (/^[A-Z0-9-]{2,}$/.test(part)) return part;
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      })
      .join(" ");

  const handleSmartFill = async () => {
    if (!smartFillText.trim()) return;
    setParsing(true);
    setError("");

    try {
      // 1. Reset target fields to "empty" state first
      const resetState = {
        make: "",
        model: "",
        year: "",
        price: "",
        mileage: "",
        engineCC: "",
        variant: ""
      };
      
      let detectedYear = "";
      let detectedMake = "";
      let detectedModel = "";
      let detectedPrice = "";
      let detectedMileage = "";
      let detectedCC = "";

      // Detection 1: Year (4 digits 19xx or 20xx)
      const yearMatch = smartFillText.match(/\b(19|20)\d{2}\b/);
      if (yearMatch) {
        detectedYear = parseInt(yearMatch[0], 10);
      }

      // Detection 2: Make (from our MAKES list, longest first to avoid partial clashes)
      const makesByLength = [...MAKES].sort((a, b) => b.length - a.length);
      for (const make of makesByLength) {
        if (new RegExp(`\\b${make.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(smartFillText)) {
          detectedMake = make;
          break;
        }
      }

      // Detection 3: Model (supports multi-word model tokens after make)
      if (detectedMake) {
        const words = smartFillText.split(/[\s,]+/).filter(Boolean);
        const makeIdx = words.findIndex(w => w.toLowerCase() === detectedMake.toLowerCase());
        if (makeIdx !== -1) {
          const stopTokens = new Set([
            "price", "ksh", "kes", "usd", "km", "mileage", "cc", "litre", "liter",
            "automatic", "manual", "petrol", "diesel", "hybrid", "engine", "color", "colour",
          ]);
          const modelParts = [];
          for (let i = makeIdx + 1; i < Math.min(words.length, makeIdx + 4); i += 1) {
            const cleaned = normalizeModelToken(words[i]);
            if (!cleaned) break;
            if (stopTokens.has(cleaned.toLowerCase())) break;
            modelParts.push(cleaned);
          }
          if (modelParts.length > 0) {
            detectedModel = toTitleCase(modelParts.join(" "));
          }
        }
      }

      // Detection 4: Price
      const priceRegex = /(?:ksh|kes|usd|price|cost|asking|@)\s*[:\-]?\s*([\d,.]+)\s*(m|million|k)?\b|([\d,.]+)\s*(m|million)\b/gi;
      const matches = smartFillText.matchAll(new RegExp(priceRegex, 'gi'));
      for (const match of matches) {
        const raw = (match[1] || match[3] || "").replace(/,/g, "");
        if (!raw) continue;
        let val = raw;
        let num = parseFloat(val);
        if (isNaN(num)) continue;

        const context = smartFillText.toLowerCase();
        const snippet = context.substring(Math.max(0, (match.index || 0) - 18), (match.index || 0) + 28);
        const suffix = (match[2] || match[4] || "").toLowerCase();
        
        if (suffix === "m" || suffix === "million" || snippet.includes(" million")) {
          if (num < 100) num = num * 1000000;
        } else if ((suffix === "k" || snippet.includes(" k")) && !snippet.includes('km')) {
          if (num < 10000) num = num * 1000;
        }

        if (num > 50000 && num < 100000000) {
          detectedPrice = num;
          break;
        }
      }

      // Detection 5: Mileage
      const mileageRegex = /(?:mileage[:\s-]*)?([\d,.]+)\s*(k)?\s*(?:km|km's|miles)?\b/i;
      const mileageMatch = smartFillText.match(mileageRegex);
      if (mileageMatch) {
        let val = mileageMatch[1].replace(/,/g, '');
        let num = parseFloat(val);
        if (mileageMatch[2] && num < 1000) num = num * 1000;
        const context = smartFillText.toLowerCase().substring(mileageMatch.index, mileageMatch.index + 24);
        if (context.includes(" km") && context.includes("k") && num < 1000) num = num * 1000;
        
        if (num > 0 && num < 1000000) {
          detectedMileage = num;
        }
      }

      // Detection 6: Engine CC (supports both 1490cc and 1.5L)
      const ccMatch = smartFillText.match(/(\d{3,4})\s*(?:cc)\b/i);
      if (ccMatch) {
        detectedCC = parseInt(ccMatch[1], 10);
      } else {
        const litresMatch = smartFillText.match(/(\d(?:\.\d)?)\s*(?:l|litre|liter)\b/i);
        if (litresMatch) {
          detectedCC = Math.round(parseFloat(litresMatch[1]) * 1000);
        }
      }

      // Detection 7: Features (from FEATURE_CHECKLIST)
      const detectedFeatures = [];
      const lowerText = smartFillText.toLowerCase();
      FEATURE_CHECKLIST.forEach(feature => {
        const featureLower = feature.toLowerCase();
        // Simple word match, but also handle some common variations
        if (lowerText.includes(featureLower)) {
          detectedFeatures.push(feature);
        } else if (featureLower.includes("camera") && lowerText.includes("camera")) {
          // If "Reverse Camera" is in checklist and text has "camera", but maybe user said "rear camera"
          if (!detectedFeatures.includes(feature)) detectedFeatures.push(feature);
        } else if (featureLower === "leather seats" && lowerText.includes("leather")) {
          if (!detectedFeatures.includes(feature)) detectedFeatures.push(feature);
        } else if (featureLower === "keyless entry" && (lowerText.includes("keyless") || lowerText.includes("push start"))) {
           if (!detectedFeatures.includes(feature)) detectedFeatures.push(feature);
        }
      });

      // Final State Application
      // Only set detected values, keep others empty as per request
      setSelectedYear(detectedYear ? String(detectedYear) : "");
      setSelectedMake(detectedMake || "");
      setSelectedModel(detectedModel || "");
      setPriceInput(detectedPrice ? String(detectedPrice) : "");
      setSelectedFeatures(detectedFeatures);

      setFormSeed(prev => ({
        ...prev,
        ...resetState, // Clear target fields first
        make: detectedMake || "",
        model: detectedModel || "",
        year: detectedYear || "",
        price: detectedPrice || "",
        mileage: detectedMileage || "",
        engineCC: detectedCC || ""
      }));

      // Visual feedback
      setFormVersion(v => v + 1);
      if (!detectedMake && !detectedModel && !detectedPrice && !detectedMileage && !detectedYear) {
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
    <form key={formVersion} ref={formRef} onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-700">
      <div className="bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            {checklistItems.map((item, idx) => {
              const done = checklist[item.key];
              return (
                <div key={item.key} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${done ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 text-slate-400"}`}>
                    {done ? <Check size={12} /> : <span className="text-[10px] font-bold">{idx + 1}</span>}
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">{item.label}</span>
                  {idx < checklistItems.length - 1 && <ChevronRight size={13} className="text-slate-300" />}
                </div>
              );
            })}
          </div>
          <span className="text-[11px] font-black uppercase tracking-wider text-[#ff5a2f]">{checklistDone}/4 complete</span>
        </div>
      </div>
      {isNew && (
        <div className="bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Upload Flow</p>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">{simpleMode ? "Quick Upload" : "Advanced Upload"}</h2>
              <p className="text-sm font-semibold text-slate-500 mt-1">
                {simpleMode ? "Publish fast with essentials first. Add advanced specs any time." : "Full control with all technical fields now."}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSimpleMode(true)}
                className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider border transition-colors ${
                  simpleMode 
                    ? "bg-slate-900 border-slate-900 text-white dark:bg-[#3f3f46] dark:text-white dark:border-[#3f3f46]" 
                    : "bg-white border-[#ddd4c8] dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:text-white dark:bg-[#111111] dark:border-[#27272a] dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                Quick
              </button>
              <button
                type="button"
                onClick={() => setSimpleMode(false)}
                className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider border transition-colors ${
                  !simpleMode 
                    ? "bg-slate-900 border-slate-900 text-white dark:bg-[#3f3f46] dark:text-white dark:border-[#3f3f46]" 
                    : "bg-white border-[#ddd4c8] dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:text-white dark:bg-[#111111] dark:border-[#27272a] dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                Advanced
              </button>
            </div>
          </div>

        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-black uppercase tracking-widest rounded-2xl px-6 py-4 flex items-center gap-3">
          <Info size={16} />
          {error}
        </div>
      )}

      {dealers.length > 1 && (
        <div className="bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl p-8">
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

      {isNew && (
        <div className="bg-gradient-to-br from-indigo-50 to-emerald-50 dark:from-zinc-900/50 dark:to-zinc-800/50 border border-indigo-100 dark:border-zinc-800 rounded-2xl p-8 mb-10 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
             <Sparkles size={120} className="text-indigo-500" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                <Sparkles size={20} />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">AI Smart Fill</h3>
            </div>
            
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-6 max-w-xl">
              Paste a description from WhatsApp, a website, or a draft. We'll pick out the Year, Make, Model, Price, and Mileage for you instantly.
            </p>

            <div className="space-y-4">
              <textarea
                value={smartFillText}
                onChange={(e) => setSmartFillText(e.target.value)}
                placeholder="e.g. 2017 Toyota Rav4, White, 45,000 km, Price: 3.2M, clean car..."
                className="w-full h-32 bg-white/60 dark:bg-zinc-900/40 backdrop-blur-sm border border-indigo-200 dark:border-zinc-700 rounded-2xl px-6 py-4 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-indigo-500 transition-all resize-none shadow-inner"
              />
              
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSmartFill}
                  disabled={parsing || !smartFillText.trim()}
                  className="px-8 py-3.5 bg-indigo-600 hover:bg-slate-900 dark:hover:bg-white dark:hover:text-black disabled:opacity-50 text-white font-black uppercase tracking-wider rounded-2xl text-xs transition-all flex items-center gap-2 shadow-xl shadow-indigo-100 dark:shadow-none"
                >
                  {parsing ? "Analyzing..." : "Apply Magic"}
                  {!parsing && <Sparkles size={16} />}
                </button>
                {smartFillText && (
                   <button 
                    type="button" 
                    onClick={() => setSmartFillText("")}
                    className="text-xs font-bold text-slate-500 hover:text-rose-600 uppercase tracking-widest px-4"
                   >
                     Clear
                   </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
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
                className={inputCls}
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
                className={inputCls}
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
                className={inputCls}
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
                className={selectCls}
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
              <div className="flex flex-wrap items-end justify-between mb-2">
                <label className={labelCls} style={{ marginBottom: 0 }}>Price *</label>
                <div className="flex items-center bg-[#f0f3f5] dark:bg-[#111111] border border-[#ddd4c8] dark:border-[#27272a] rounded-2xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setCurrency("KES")}
                    className={`px-3 py-1 text-[11px] font-black tracking-widest uppercase transition-colors ${currency === "KES" ? "bg-slate-900 text-white dark:bg-[#3f3f46] dark:text-white" : "text-slate-500 hover:text-slate-800 dark:text-slate-200 dark:text-slate-400 dark:hover:text-white"}`}
                  >
                    KES
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrency("USD")}
                    className={`px-3 py-1 text-[11px] font-black tracking-widest uppercase transition-colors ${currency === "USD" ? "bg-slate-900 text-white dark:bg-[#3f3f46] dark:text-white" : "text-slate-500 hover:text-slate-800 dark:text-slate-200 dark:text-slate-400 dark:hover:text-white"}`}
                  >
                    USD
                  </button>
                </div>
              </div>
              <input 
                name="price" 
                type="number" 
                required 
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                placeholder={currency === "KES" ? "e.g. 2500000" : "e.g. 18500"} 
                className={inputCls} 
              />
              {currency === "USD" && Boolean(priceInput) && !isNaN(parseInt(priceInput, 10)) && (
                <p className="mt-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  ≈ {new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(parseInt(priceInput, 10) * EXCHANGE_RATE)}
                  <span className="font-medium text-slate-400 ml-1">(Purchase Price base. Taxes will be automatically added up later)</span>
                </p>
              )}
            </div>

            <div>
              <label className={labelCls}>Mileage (km)</label>
              <input name="mileage" type="number" defaultValue={formSeed.mileage} placeholder="e.g. 52000" className={inputCls} />
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
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">3+ photos recommended</p>
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
            <div className="mt-4 flex items-center gap-2 text-[11px] font-semibold text-slate-500">
              <UploadCloud size={14} className="text-[#ff5a2f]" />
              Upload starts immediately so dealers can continue filling details while photos process.
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
               <div className="flex items-center gap-3 mb-6">
                  <div className="w-1.5 h-1.5 rounded-2xl bg-indigo-500" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Listing Video</h3>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                  <div className="space-y-3">
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                          Increase engagement by adding a YouTube or Vimeo link. A preview will appear on the right if the link is valid.
                      </p>
                      <input 
                        name="videoUrl" 
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder="e.g. https://www.youtube.com/watch?v=..." 
                        className={inputCls} 
                      />
                  </div>
                  
                  <div className="aspect-video bg-slate-100 dark:bg-[#111111] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center relative group">
                      {videoUrl ? (
                         <iframe 
                            className="w-full h-full"
                            src={(() => {
                               if (videoUrl.includes("youtube.com/watch?v=")) return videoUrl.replace("watch?v=", "embed/");
                               if (videoUrl.includes("youtu.be/")) return `https://www.youtube.com/embed/${videoUrl.split("youtu.be/")[1]}`;
                               if (videoUrl.includes("vimeo.com/")) return `https://player.vimeo.com/video/${videoUrl.split("vimeo.com/")[1]}`;
                               return videoUrl;
                            })()}
                            title="Video preview"
                            allowFullScreen
                         />
                      ) : (
                        <div className="text-center p-6">
                            <UploadCloud size={40} className="mx-auto mb-3 text-slate-300 dark:text-slate-700" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No Video Attached</p>
                        </div>
                      )}
                  </div>
               </div>
            </div>
          </div>
        </div>

        <div>
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-1.5 h-1.5 rounded-2xl bg-purple-500" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Description</h3>
              </div>
              <textarea name="description" rows={5} defaultValue={formSeed.description} placeholder="Share condition, service history, and key selling points..." className={`${inputCls} resize-none`} />
            </div>
            <div className="bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Feature Checklist</p>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Tap to select car features</h3>
                </div>
                <span className="text-xs font-bold text-[#ff5a2f] bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-2xl">{selectedFeatures.length} selected</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5">
                {FEATURE_CHECKLIST.map((feature) => {
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
            </div>
            {!simpleMode && (
              <div className="bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-8">
                  <Sparkles size={16} className="text-amber-500" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Advanced Specs</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className={labelCls}>Engine CC</label>
                    <input name="engineCC" type="number" defaultValue={formSeed.engineCC} placeholder="e.g. 2000" className={inputCls} />
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
                    <label className={labelCls}>Import Eligibility</label>
                    <select name="importEligibility" defaultValue={formSeed.importEligibility} className={selectCls}>
                      <option value="">Auto (derive by year)</option>
                      <option value="true">Eligible</option>
                      <option value="false">Not Eligible</option>
                    </select>
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
                  <div>
                    <label className={labelCls}>Color</label>
                    <input name="color" defaultValue={formSeed.color} placeholder="e.g. Pearl White" className={inputCls} />
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
              </div>
            )}
            <div className="bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl p-5">
              <label className={labelCls}>Tags</label>
              <div className="flex flex-wrap gap-2 mt-3">
                {Object.keys(BADGE_OPTIONS).map((name) => {
                  const active = badges.includes(name);
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setBadges((prev) => (active ? prev.filter((b) => b !== name) : [...prev, name]))}
                      className={`text-[11px] font-bold uppercase tracking-wider px-4 py-2 rounded-2xl border transition-all ${
                        active ? "bg-[#ff5a2f] border-[#ff5a2f] text-slate-900 dark:text-white" : "bg-[#fbfcfe] dark:bg-[#111111] border-[#ddd4c8] dark:border-slate-800 text-slate-600"
                      }`}
                    >
                      {active && <Check size={10} className="inline-block mr-1.5" />} {name}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Listing Quality</p>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Score: {score}/100</h3>
                </div>
                <div className="w-full sm:w-60 h-3 rounded-2xl bg-slate-100 overflow-hidden">
                  <div className="h-full bg-[#ff5a2f] transition-all" style={{ width: `${score}%` }} />
                </div>
              </div>
              <p className="text-xs text-slate-500 font-semibold mt-3">
                Add 3+ photos, a clear description, and more features for better visibility.
              </p>
            </div>
            <div className="bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl p-5">
              <div className="flex items-center gap-8 flex-wrap">
                {[
                  { name: "negotiable", label: "Accepting Offers", defaultChecked: !!formSeed.negotiable },
                  { name: "dutyPaid", label: "Duty Paid", defaultChecked: !!formSeed.dutyPaid },
                  { name: "imported", label: "Imported", defaultChecked: !!formSeed.imported },
                  { name: "featured", label: "Featured", defaultChecked: !!formSeed.featured && !isPortal },
                ].map(({ name, label, defaultChecked }) => (
                  <label key={name} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name={name}
                      defaultChecked={name === "featured" && isPortal ? false : defaultChecked}
                      disabled={name === "featured" && isPortal}
                      className="w-5 h-5 accent-[#ff5a2f] rounded-2xl"
                    />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-between items-center gap-3 pt-2">
          <a href={isPortal ? "/portal" : "/admin"} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs uppercase tracking-wider transition-all">
            Cancel
          </a>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={submitting || uploading}
              className="px-8 py-3 bg-[#ff5a2f] hover:bg-emerald-700 disabled:opacity-50 text-slate-900 dark:text-white font-bold rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
            >
              {submitting ? "Saving..." : isEdit ? "Save Changes" : "Publish Listing"}
              {!submitting && <Check size={16} />}
            </button>
          </div>
        </div>
      </div>
    </form>
    );
  }

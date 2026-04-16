"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Info, Sparkles, UploadCloud } from "lucide-react";
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

const WIZARD_STEPS = [
  { id: 1, label: "Basics" },
  { id: 2, label: "Photos" },
  { id: 3, label: "Details" },
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
    () => (isNew ? `motorke:car-draft:${isPortal ? "portal" : "admin"}:${dealerScope}` : null),
    [isNew, isPortal, dealerScope]
  );
  const defaultsKey = useMemo(
    () => `motorke:car-defaults:${isPortal ? "portal" : "admin"}:${dealerScope}`,
    [isPortal, dealerScope]
  );

  const baseSeed = useMemo(() => buildBaseSeed(car, currentYear), [car, currentYear]);

  const [formSeed, setFormSeed] = useState(baseSeed);
  const [formVersion, setFormVersion] = useState(0);
  const [step, setStep] = useState(1);
  const [simpleMode, setSimpleMode] = useState(initialSimpleMode);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
  const [images, setImages] = useState(
    car?.images?.map((img) => ({ url: img.url, isPrimary: img.isPrimary })) || []
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [badges, setBadges] = useState(car?.badges || []);
  const [selectedFeatures, setSelectedFeatures] = useState(car?.features || []);
  const [customFeature, setCustomFeature] = useState("");
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [selectedMake, setSelectedMake] = useState((baseSeed.make || "").trim());
  const [modelOptions, setModelOptions] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelSources, setModelSources] = useState(["inventory"]);
  const [selectedModel, setSelectedModel] = useState((baseSeed.model || "").trim());
  const [selectedYear, setSelectedYear] = useState(String(baseSeed.year || currentYear));
  const [variantOptions, setVariantOptions] = useState([]);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [variantSources, setVariantSources] = useState(["inventory"]);

  const formRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const score = qualityScore(formSeed, images, selectedFeatures);

  const inputCls = "w-full bg-[#fbfcfe] border border-[#ddd4c8] rounded-none px-4 py-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:border-#ff5a2f transition-all";
  const selectCls = "w-full bg-[#fbfcfe] border border-[#ddd4c8] rounded-none px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-#ff5a2f transition-all appearance-none";
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
        step,
        simpleMode,
        updatedAt: Date.now(),
      })
    );
  }, [badges, draftKey, images, isNew, selectedFeatures, simpleMode, step]);

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
        setStep(parsed.step || 1);
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
  }, [images, badges, selectedFeatures, step, simpleMode, isNew, saveDraft]);

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

  async function handleFilesSelected(newFiles) {
    const toUpload = newFiles.filter((f) => !f.url);
    if (!toUpload.length) {
      setImages(newFiles.map((f) => ({ url: f.url || f.preview, isPrimary: f.isPrimary })));
      return;
    }

    setUploading(true);
    setError("");
    setUploadProgress({ done: 0, total: toUpload.length });

    const results = await Promise.allSettled(
      toUpload.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || `Failed: ${file.name}`);
        setUploadProgress((prev) => ({ ...prev, done: prev.done + 1 }));
        return data.url;
      })
    );

    const urls = results.filter((r) => r.status === "fulfilled").map((r) => r.value);
    const failures = results.filter((r) => r.status === "rejected").map((r) => r.reason.message);

    setImages((prev) => {
      const incoming = urls.map((url, idx) => ({ url, isPrimary: prev.length === 0 && idx === 0 }));
      return [...prev, ...incoming];
    });

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

  function validateStep(nextStep) {
    if (!formRef.current) return false;
    const fd = new FormData(formRef.current);

    if (step === 1 && nextStep > 1) {
      const required = ["make", "model", "year", "price"];
      const missing = required.filter((field) => !(fd.get(field) || "").toString().trim());
      if (missing.length > 0) {
        setError("Please fill make, model, year and price before continuing.");
        return false;
      }
    }

    if (step === 2 && nextStep > 2 && images.length === 0) {
      setError("Please upload at least one image before continuing.");
      return false;
    }

    setError("");
    return true;
  }

  function goToStep(next) {
    if (next > step && !validateStep(next)) return;
    setStep(next);
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
    data.price = parseInt(data.price, 10);
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

      if (draftKey) localStorage.removeItem(draftKey);
      window.location.href = result.redirectTo || (isPortal ? "/portal" : "/admin/cars");
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <form key={formVersion} ref={formRef} onSubmit={handleSubmit} className="space-y-10 animate-in fade-in duration-700">
      {isNew && (
        <div className="bg-white border border-[#ddd4c8] rounded-none p-6 space-y-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Upload Flow</p>
              <h2 className="text-xl font-black text-slate-900">{simpleMode ? "Quick Upload" : "Advanced Upload"}</h2>
              <p className="text-sm font-semibold text-slate-500 mt-1">
                {simpleMode ? "Publish fast with essentials first. Add advanced specs any time." : "Full control with all technical fields now."}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSimpleMode(true)}
                className={`px-4 py-2 rounded-none text-xs font-black uppercase tracking-wider border transition-colors ${
                  simpleMode ? "bg-slate-900 text-slate-900 border-slate-900" : "bg-white text-slate-600 border-[#ddd4c8]"
                }`}
              >
                Quick
              </button>
              <button
                type="button"
                onClick={() => setSimpleMode(false)}
                className={`px-4 py-2 rounded-none text-xs font-black uppercase tracking-wider border transition-colors ${
                  !simpleMode ? "bg-slate-900 text-slate-900 border-slate-900" : "bg-white text-slate-600 border-[#ddd4c8]"
                }`}
              >
                Advanced
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {WIZARD_STEPS.map((wizardStep) => (
              <button
                key={wizardStep.id}
                type="button"
                onClick={() => goToStep(wizardStep.id)}
                className={`rounded-none border px-3 py-2.5 text-left transition-colors ${
                  step === wizardStep.id
                    ? "border-#ff5a2f bg-emerald-50"
                    : "border-[#ddd4c8] bg-white hover:bg-[#fbfcfe]"
                }`}
              >
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Step {wizardStep.id}</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{wizardStep.label}</p>
              </button>
            ))}
          </div>

          {draftLoaded && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-none border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-[11px] font-bold text-amber-800">Draft restored from previous session.</p>
              <button type="button" onClick={clearDraft} className="text-[11px] font-black uppercase tracking-wider text-amber-700 hover:text-amber-900">
                Clear Draft
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-black uppercase tracking-widest rounded-none px-6 py-4 flex items-center gap-3">
          <Info size={16} />
          {error}
        </div>
      )}

      {dealers.length > 1 && (
        <div className="bg-white border border-[#ddd4c8] rounded-none p-8">
          <label className={labelCls}>Assigned Dealer *</label>
          <select name="dealerId" defaultValue={formSeed.dealerId || ""} required className={selectCls}>
            <option value="">Select dealer</option>
            {dealers.map((dealer) => (
              <option key={dealer.id} value={dealer.id}>{dealer.name} - {dealer.location}</option>
            ))}
          </select>
        </div>
      )}
      {dealers.length === 1 && dealers[0] && <input type="hidden" name="dealerId" value={dealers[0].id} />}

      <div className={isNew && step !== 1 ? "hidden" : "block"}>
        <div className="bg-white border border-[#ddd4c8] rounded-none p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1.5 h-1.5 rounded-none bg-#ff5a2f" />
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Vehicle Basics</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <p className="mt-1 text-[10px] font-semibold text-slate-500">
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
              <p className="mt-1 text-[10px] font-semibold text-slate-500">
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
              <label className={labelCls}>Price (KES) *</label>
              <input name="price" type="number" required defaultValue={formSeed.price} placeholder="e.g. 2500000" className={inputCls} />
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
        </div>

          <div className={isNew && step !== 2 ? "hidden" : "block"}>
            <div className="bg-white border border-[#ddd4c8] rounded-none p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-none bg-#ff5a2f" />
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Photos</h3>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">3+ photos recommended</p>
            </div>
            {uploading && (
              <div className="text-center mb-8 p-6 bg-[#fbfcfe] border border-[#ddd4c8] rounded-none">
                <div className="w-10 h-10 border-4 border-#ff5a2f border-t-transparent rounded-none animate-spin mx-auto mb-4" />
                <p className="text-sm font-bold text-slate-900 uppercase">Uploading Images...</p>
                <p className="text-[10px] font-bold text-slate-500 mt-2">Image {uploadProgress.done} of {uploadProgress.total}</p>
              </div>
            )}
            <div className={uploading ? "opacity-50 pointer-events-none" : ""}>
              <MediaUploader initialImages={images} onFilesSelected={handleFilesSelected} maxFiles={15} />
            </div>
            <div className="mt-4 flex items-center gap-2 text-[11px] font-semibold text-slate-500">
              <UploadCloud size={14} className="text-#ff5a2f" />
              Upload starts immediately so dealers can continue filling details while photos process.
            </div>
          </div>
        </div>

        <div className={isNew && step !== 3 ? "hidden" : "block"}>
          <div className="space-y-6">
            <div className="bg-white border border-[#ddd4c8] rounded-none p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-1.5 h-1.5 rounded-none bg-purple-500" />
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Description</h3>
              </div>
              <textarea name="description" rows={5} defaultValue={formSeed.description} placeholder="Share condition, service history, and key selling points..." className={`${inputCls} resize-none`} />
            </div>
            <div className="bg-white border border-[#ddd4c8] rounded-none p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Feature Checklist</p>
                  <h3 className="text-lg font-bold text-slate-900">Tap to select car features</h3>
                </div>
                <span className="text-xs font-bold text-#ff5a2f bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-none">{selectedFeatures.length} selected</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5">
                {FEATURE_CHECKLIST.map((feature) => {
                  const active = selectedFeatures.includes(feature);
                  return (
                    <button
                      key={feature}
                      type="button"
                      onClick={() => toggleFeature(feature)}
                      className={`text-left text-[11px] font-bold px-3 py-2.5 rounded-none border transition-all ${
                        active ? "bg-#ff5a2f text-slate-900 border-#ff5a2f" : "bg-[#fbfcfe] text-slate-700 border-[#ddd4c8] hover:bg-slate-100"
                      }`}
                    >
                      {feature}
                    </button>
                  );
                })}
              </div>
              <div className="mt-5 flex flex-col sm:flex-row gap-2">
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
                <button type="button" onClick={addCustomFeature} className="px-4 py-3 rounded-none bg-slate-900 text-slate-900 text-xs font-black uppercase tracking-wider">
                  Add Feature
                </button>
              </div>
            </div>
            {!simpleMode && (
              <div className="bg-white border border-[#ddd4c8] rounded-none p-8">
                <div className="flex items-center gap-3 mb-8">
                  <Sparkles size={16} className="text-amber-500" />
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">Advanced Specs</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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
                      <input type="checkbox" name="turbo" defaultChecked={!!formSeed.turbo} className="w-4 h-4 accent-#ff5a2f" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Turbo</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" name="sunroof" defaultChecked={!!formSeed.sunroof} className="w-4 h-4 accent-#ff5a2f" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Sunroof</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
            <div className="bg-white border border-[#ddd4c8] rounded-none p-8">
              <label className={labelCls}>Tags</label>
              <div className="flex flex-wrap gap-2 mt-3">
                {Object.keys(BADGE_OPTIONS).map((name) => {
                  const active = badges.includes(name);
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setBadges((prev) => (active ? prev.filter((b) => b !== name) : [...prev, name]))}
                      className={`text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-none border transition-all ${
                        active ? "bg-#ff5a2f border-#ff5a2f text-slate-900" : "bg-[#fbfcfe] border-[#ddd4c8] text-slate-600"
                      }`}
                    >
                      {active && <Check size={10} className="inline-block mr-1.5" />} {name}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="bg-white border border-[#ddd4c8] rounded-none p-8">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Listing Quality</p>
                  <h3 className="text-lg font-bold text-slate-900">Score: {score}/100</h3>
                </div>
                <div className="w-full sm:w-60 h-3 rounded-none bg-slate-100 overflow-hidden">
                  <div className="h-full bg-#ff5a2f transition-all" style={{ width: `${score}%` }} />
                </div>
              </div>
              <p className="text-xs text-slate-500 font-semibold mt-3">
                Add 3+ photos, a clear description, and more features for better visibility.
              </p>
            </div>
            <div className="bg-white border border-[#ddd4c8] rounded-none p-8">
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
                      className="w-5 h-5 accent-#ff5a2f rounded-none"
                    />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-between items-center gap-3 pt-2">
          <a href={isPortal ? "/portal" : "/admin"} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-none text-xs uppercase tracking-wider transition-all">
            Cancel
          </a>
          <div className="flex items-center gap-2">
            {isNew && step > 1 && (
              <button type="button" onClick={() => goToStep(step - 1)} className="px-5 py-3 rounded-none border border-[#ddd4c8] text-slate-700 text-xs font-black uppercase tracking-wider">
                Back
              </button>
            )}
            {isNew && step < 3 ? (
              <button type="button" onClick={() => goToStep(step + 1)} className="px-6 py-3 rounded-none bg-slate-900 text-slate-900 text-xs font-black uppercase tracking-wider">
                Continue
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting || uploading}
                className="px-8 py-3 bg-#ff5a2f hover:bg-emerald-700 disabled:opacity-50 text-slate-900 font-bold rounded-none text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
              >
                {submitting ? "Saving..." : isEdit ? "Save Changes" : "Publish Listing"}
                {!submitting && <Check size={16} />}
              </button>
            )}
          </div>
        </div>
      </form>
    );
  }

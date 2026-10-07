"use client";
import { useState } from "react";
import {
  Hash, Factory, Car, Calendar, Gauge, Cog, Fuel, Settings, Layers,
  MoveRight, CarFront, Users, Globe, BadgeCheck, Sparkles, Tag, Circle,
  Zap, Wrench, Wind, Shield, Sun, Ruler, Palette, Battery, FileText,
  Package, CheckCircle2, Info,
} from "lucide-react";
import { BODY_TYPE_LABELS, FUEL_LABELS } from "@/lib/constants";
import { formatCarPrice, formatMileage } from "@/lib/utils";
import { stockCode } from "@/lib/stock-code";
import { positiveNum } from "@/lib/car-display";

const HYBRID_BATTERY_LABELS = {
  NIMH: "NiMH",
  LI_ION: "Li-ion",
  OTHER: "Other",
  NA: "N/A",
};

// Relevant icon for each spec row (falls back to Info for anything unseen).
const SPEC_ICONS = {
  "Stock No.": Hash,
  Maker: Factory,
  Model: Car,
  Year: Calendar,
  Mileage: Gauge,
  Engine: Cog,
  Fuel: Fuel,
  Transmission: Settings,
  Drive: Layers,
  Steering: MoveRight,
  "Body Type": CarFront,
  "Doors / Seats": Users,
  "Imported From": Globe,
  "Duty Status": BadgeCheck,
  Condition: Sparkles,
  Price: Tag,
  Cylinders: Circle,
  Horsepower: Zap,
  Torque: Wrench,
  Turbo: Wind,
  Airbags: Shield,
  Sunroof: Sun,
  "Ground clearance": Ruler,
  Color: Palette,
  "Hybrid battery": Battery,
  "Import eligibility": CheckCircle2,
  Registration: FileText,
  "Spare availability": Package,
};

/**
 * Dense Nikkyo-style specification table for a car listing detail page.
 * Core rows always render; additional rows reveal under "+ MORE".
 */
export default function NikkyoSpecTable({ car, title = null }) {
  const [showMore, setShowMore] = useState(false);

  const rows = [
    { label: "Stock No.", value: stockCode(car) || "—" },
    { label: "Maker", value: car.make || "—" },
    {
      label: "Model",
      value: `${car.model || "—"}${car.variant ? ` ${car.variant}` : ""}`.trim(),
    },
    { label: "Year", value: car.year ? String(car.year) : "—" },
    { label: "Mileage", value: car.mileage != null ? formatMileage(car.mileage) : "—" },
    {
      label: "Engine",
      value: car.engineCC
        ? `${Number(car.engineCC).toLocaleString("en-KE")} cc`
        : car.fuelType
          ? FUEL_LABELS[car.fuelType] || car.fuelType
          : "—",
    },
    {
      label: "Fuel",
      value: car.fuelType ? FUEL_LABELS[car.fuelType] || car.fuelType : "—",
    },
    {
      label: "Transmission",
      value: car.transmission
        ? car.transmission === "AUTOMATIC"
          ? "Automatic"
          : car.transmission === "MANUAL"
            ? "Manual"
            : car.transmission
        : "—",
    },
    { label: "Drive", value: car.drivetrain || "—" },
    { label: "Steering", value: car.steering || "—" },
    {
      label: "Body Type",
      value: car.bodyType ? BODY_TYPE_LABELS[car.bodyType] || car.bodyType : "—",
    },
    {
      label: "Doors / Seats",
      value: `${car.doors || "—"} / ${car.seats || "—"}`,
    },
    {
      label: "Imported From",
      value: car.importCountry || (car.imported === false ? "Local" : "—"),
    },
    {
      label: "Duty Status",
      value: car.dutyPaid ? "Duty paid" : car.dutyPaid === false ? "Duty not paid" : "—",
    },
    {
      label: "Condition",
      value: car.condition === "NEW" ? "New" : car.condition === "CERTIFIED" ? "Certified used" : "Used",
    },
    { label: "Price", value: formatCarPrice(car) },
  ];

  const extraRows = [];
  if (positiveNum(car.cylinders)) {
    extraRows.push({ label: "Cylinders", value: String(Number(car.cylinders)) });
  }
  if (positiveNum(car.horsepower)) {
    extraRows.push({ label: "Horsepower", value: `${Math.round(Number(car.horsepower))} hp` });
  }
  if (positiveNum(car.torque)) {
    extraRows.push({ label: "Torque", value: `${Math.round(Number(car.torque))} Nm` });
  }
  if (car.turbo === true) extraRows.push({ label: "Turbo", value: "Turbocharged" });
  if (positiveNum(car.airbags)) extraRows.push({ label: "Airbags", value: String(Number(car.airbags)) });
  if (car.sunroof === true) extraRows.push({ label: "Sunroof", value: "Yes" });
  if (positiveNum(car.groundClearanceMm)) {
    extraRows.push({ label: "Ground clearance", value: `${Number(car.groundClearanceMm)} mm` });
  }
  if (car.color?.trim()) extraRows.push({ label: "Color", value: car.color.trim() });
  if (car.hybridBatteryTech && HYBRID_BATTERY_LABELS[car.hybridBatteryTech]) {
    extraRows.push({ label: "Hybrid battery", value: HYBRID_BATTERY_LABELS[car.hybridBatteryTech] });
  }
  if (car.importEligibility === true) {
    extraRows.push({ label: "Import eligibility", value: "Eligible" });
  } else if (car.importEligibility === false) {
    extraRows.push({ label: "Import eligibility", value: "Not eligible" });
  }
  if (car.registered === false) extraRows.push({ label: "Registration", value: "Not registered" });
  if (positiveNum(car.spareAvailability)) {
    extraRows.push({ label: "Spare availability", value: `${Number(car.spareAvailability)}/10` });
  }

  const visibleRows = showMore ? rows.concat(extraRows) : rows;

  const Row = ({ row, last }) => {
    const Icon = SPEC_ICONS[row.label] || Info;
    return (
      <div
        className={`grid grid-cols-[150px_minmax(0,1fr)] text-[13px] transition-colors hover:bg-slate-100 ${
          last ? "" : "border-b border-slate-200"
        }`}
      >
        <span className="flex items-center gap-2 bg-sky-50 border-r border-slate-200 px-3 py-2.5 font-bold uppercase tracking-wide text-slate-500">
          <Icon className="w-3.5 h-3.5 shrink-0 text-slate-400" aria-hidden />
          <span className="truncate">{row.label}</span>
        </span>
        <span className="px-4 py-2.5 text-right font-bold text-slate-900">{row.value}</span>
      </div>
    );
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      {title && (
        <div className="bg-[var(--sidebar-bar)] px-4 py-2.5">
          <h2 className="text-[12px] font-black uppercase tracking-widest text-white">{title}</h2>
        </div>
      )}
      {visibleRows.map((row, i) => (
        <Row key={row.label} row={row} last={i === visibleRows.length - 1} />
      ))}
      {extraRows.length > 0 && (
        <button
          type="button"
          onClick={() => setShowMore((s) => !s)}
          className="flex w-full items-center justify-between bg-slate-50 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-[var(--accent)] transition-colors hover:bg-slate-100"
          aria-expanded={showMore}
        >
          <span>{showMore ? "− Show less" : "+ MORE SPECIFICATIONS"}</span>
          <svg
            className={`w-4 h-4 transition-transform ${showMore ? "rotate-180" : ""}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      )}
    </div>
  );
}

import { BODY_TYPE_LABELS, FUEL_LABELS } from "@/lib/constants";
import { formatCarPrice, formatMileage } from "@/lib/utils";
import { stockCode } from "@/lib/stock-code";

/**
 * Dense Nikkyo-style specification table for a car listing detail page.
 */
export default function NikkyoSpecTable({ car, title = null }) {
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
    { label: "Duty Status", value: car.dutyPaid ? "Duty paid" : car.dutyPaid === false ? "Duty not paid" : "—" },
    {
      label: "Condition",
      value: car.condition === "NEW" ? "New" : car.condition === "CERTIFIED" ? "Certified used" : "Used",
    },
    { label: "Price", value: formatCarPrice(car) },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      {title && (
        <div className="bg-[var(--sidebar-bar)] px-4 py-2.5">
          <h2 className="text-[12px] font-black uppercase tracking-widest text-white">{title}</h2>
        </div>
      )}
      {rows.map((row, i) => (
        <div
          key={row.label}
          className={`grid grid-cols-[130px_minmax(0,1fr)] text-[13px] transition-colors hover:bg-slate-100 ${
            i < rows.length - 1 ? "border-b border-slate-200" : ""
          }`}
        >
          <span className="bg-sky-50 border-r border-slate-200 px-4 py-2.5 font-bold uppercase tracking-wide text-slate-500">
            {row.label}
          </span>
          <span className="px-4 py-2.5 text-right font-bold text-slate-900">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

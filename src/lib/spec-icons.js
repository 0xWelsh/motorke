import {
  Calendar,
  Gauge,
  Fuel,
  Settings2,
  Cog,
  ArrowLeftRight,
  Car,
  Hash,
  Layers,
  Zap,
  ArrowUpNarrowWide,
  Wind,
  Armchair,
  ShieldCheck,
  Sun,
  SwatchBook,
  ClipboardCheck,
  FileText,
} from "lucide-react";

const LABEL_TO_ICON = {
  Year: Calendar,
  Type: Car,
  Mileage: Gauge,
  Fuel: Fuel,
  Transmission: Settings2,
  Drivetrain: Cog,
  Steering: ArrowLeftRight,
  "Body type": Car,
  "Engine size": Hash,
  Cylinders: Layers,
  Horsepower: Zap,
  Torque: ArrowUpNarrowWide,
  Turbocharged: Wind,
  Seats: Armchair,
  Airbags: ShieldCheck,
  Sunroof: Sun,
  Color: SwatchBook,
  Condition: ClipboardCheck,
  Registration: FileText,
};

export function SpecIcon({ label, className = "w-4 h-4" }) {
  const Icon = LABEL_TO_ICON[label];
  if (!Icon) return null;
  return <Icon className={className} aria-hidden="true" />;
}

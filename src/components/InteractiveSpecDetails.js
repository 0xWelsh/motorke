"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, AlertCircle, HelpCircle, Star, BadgeCheck, Cog, Fuel, Gauge, Shirt, Ruler, Weight } from "lucide-react";

const ICON_MAP = {
  Cog: Cog,
  Fuel: Fuel,
  Gauge: Gauge,
  Shirt: Shirt,
  Ruler: Ruler,
  Weight: Weight,
};

const GLOSSARY = {
  Engine: {
    title: "Engine & Performance",
    explanation: "Engine CC (displacement) is the total volume of the cylinders. A higher CC (e.g. 2.5L Harrier or 3.0L Land Cruiser) draws more air/fuel to deliver stronger overtaking power and towing. Lower CC engines (e.g. 1.0L Passer or 1.5L Vitz) are built for city efficiency.",
    kenyanTip: "Vehicles with engines above 2000cc attract higher import duties and annual insurance rates in Kenya. Turbos add power to smaller engines but require clean oil changes.",
  },
  Fuel: {
    title: "Fuel Type & Efficiency",
    explanation: "Petrol engines are quiet and cheap to service, perfect for standard cars. Diesel engines provide massive torque at lower RPMs, ideal for trucks and heavy SUVs. Hybrids pair a petrol engine with electric motors to dramatically reduce fuel burn.",
    kenyanTip: "Hybrid vehicles (like the Toyota Fielder Hybrid or Honda Vezel) are highly sought after in Nairobi due to traffic-jam savings. Diesel fuel is subsidized but modern common-rail diesels require clean fuel filters.",
  },
  Transmission: {
    title: "Gearbox / Transmission",
    explanation: "Automatic gearboxes handle shifting automatically for comfort. Manuals give the driver direct clutch control. CVTs (Continuously Variable) offer gearless, smooth acceleration to optimize fuel use.",
    kenyanTip: "Japanese imports extensively use CVTs. Ensure you change CVT fluid every 40,000 km using correct fluid specs (e.g. Toyota TC/FE) to prevent transmission slipping.",
  },
  Drivetrain: {
    title: "Drivetrain Layout",
    explanation: "FWD (Front-Wheel Drive) powers only the front wheels, saving fuel. AWD (All-Wheel Drive) monitors traction and sends power to all four wheels if one slips. 4WD is driver-selectable, designed for low-speed off-road mud and sand.",
    kenyanTip: "If you regularly drive upcountry (shagz) where roads aren't tarmac, an AWD vehicle (like Subaru Forester/Outback) or a true 4WD (like Land Cruiser Prado) will save you from getting stuck.",
  },
  Body: {
    title: "Body Style",
    explanation: "Hatchbacks are short and easy to park. Sedans are quiet and professional. SUVs offer elevated seating and high ground clearance. Wagons combine sedan comfort with massive trunk space.",
    kenyanTip: "High-riding vehicles (SUVs and Crossovers) hold their value extremely well in Kenya because they easily clear speed bumps and handle rough weather.",
  },
  Dimensions: {
    title: "Dimensions & Capacity",
    explanation: "This details the seating capacity, door configuration, curb weight, and fuel tank capacity. Seats tell you if the car is a 5-seater or has an extra third row (7-seater).",
    kenyanTip: "7-seater vehicles (like Toyota Noah, Voxy, or Wish) have immense rental and resale demand in Kenya, often double-hatting as school run or tour transport.",
  },
  Features: {
    title: "Standard Features",
    explanation: "This highlights factory-fitted comforts and safety equipment standard for this specific model trim.",
    kenyanTip: "In Kenya, check for safety features like electronic stability control (ESC) and multiple airbags. Security additions like vehicle trackers and engine immobilizers can lower your insurance premiums.",
  }
};

export default function InteractiveSpecDetails({ specRows }) {
  const [expandedRow, setExpandedRow] = useState(null);

  const toggleRow = (label) => {
    if (expandedRow === label) {
      setExpandedRow(null);
    } else {
      setExpandedRow(label);
    }
  };

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <div className="divide-y divide-border">
          {specRows.map((row) => {
            const isExpanded = expandedRow === row.label;
            const details = GLOSSARY[row.label];
            const IconComponent = ICON_MAP[row.iconName] || Cog;

            return (
              <div key={row.label} className="transition-all duration-200 hover:bg-surface-hover">
                {/* Header/Row click trigger */}
                <button
                  onClick={() => toggleRow(row.label)}
                  className="flex w-full items-start justify-between px-5 py-4 text-left focus:outline-none"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <IconComponent className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-dim">
                          {row.label}
                        </span>
                        {details && (
                          <span className="inline-flex items-center rounded bg-surface-overlay px-1 py-0.5 text-[8px] font-bold text-muted uppercase tracking-wider">
                            Tap to learn
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm font-extrabold text-text md:text-base">
                        {row.value}
                      </p>
                    </div>
                  </div>
                  {details && (
                    <div className="ml-2 mt-1 text-dim">
                      {isExpanded ? (
                        <ChevronUp className="size-4 text-emerald-600" />
                      ) : (
                        <ChevronDown className="size-4" />
                      )}
                    </div>
                  )}
                </button>

                {/* Expanded explanation box */}
                {isExpanded && details && (
                  <div className="border-t border-subtle bg-emerald-50/30 px-5 py-4 animate-fade-in">
                    <div className="space-y-3">
                      <div>
                        <h4 className="flex items-center gap-1.5 text-xs font-bold text-text">
                          <HelpCircle className="size-3.5 text-emerald-600" />
                          About {details.title}
                        </h4>
                        <p className="mt-1 text-xs leading-relaxed text-muted">
                          {details.explanation}
                        </p>
                      </div>

                      <div className="rounded-xl bg-surface border border-emerald-100/60 p-3 shadow-sm">
                        <h5 className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-emerald-800">
                          <BadgeCheck className="size-3.5 text-emerald-600" />
                          Kenyan Market Guide
                        </h5>
                        <p className="mt-1 text-xs leading-relaxed text-secondary font-medium">
                          {details.kenyanTip}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

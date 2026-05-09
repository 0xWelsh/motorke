/**
 * Icons under /public/spec-icons — keyed by labels from {@link buildCarDetailSpecRows}.
 */
const LABEL_TO_FILENAME = {
  Year: "year.png",
  Mileage: "mileage.png",
  Fuel: "fuel-type.png",
  Transmission: "transmission.png",
  Drivetrain: "drivetrain.png",
  Steering: "steering-side.png",
  "Body type": "body-type.png",
  "Engine size": "engine-size.png",
  Cylinders: "cylinders.png",
  Horsepower: "horsepower.png",
  Torque: "torque.png",
  Turbocharged: "turbo.png",
  Seats: "car-seat.png",
  Airbags: "airbag.png",
  Sunroof: "sunroof.png",
  Color: "color.png",
  Condition: "condition.png",
  Registration: "registration.png",
};

/** @param {string} label */
export function specIconSrcForDetailLabel(label) {
  const file = LABEL_TO_FILENAME[label];
  return file ? `/spec-icons/${file}` : null;
}

/** Dark-mode PNG treatment: skip invert for multi-color artwork (e.g. color swatch). */
export function specIconImageClassName(label) {
  const base = "object-contain opacity-[0.92] dark:opacity-95";
  if (label === "Color") return `${base} dark:brightness-110`;
  return `${base} dark:[filter:invert(1)_brightness(1.08)]`;
}

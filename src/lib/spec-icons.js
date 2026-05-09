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
};

/** @param {string} label */
export function specIconSrcForDetailLabel(label) {
  const file = LABEL_TO_FILENAME[label];
  return file ? `/spec-icons/${file}` : null;
}

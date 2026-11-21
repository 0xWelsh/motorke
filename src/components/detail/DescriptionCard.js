// src/components/detail/DescriptionCard.js
// Seller description with the spec summary as a bold lead-in, so a listing
// that never filled the description field still opens with real data.
export default function DescriptionCard({ car, specString = "" }) {
  const body =
    car.description?.trim() ||
    "No written description on this listing yet. Message the BIDGARI team for condition, service history, and viewing times.";

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface">
      <h2 className="px-4 pt-4 text-[15px] font-bold text-text sm:px-5 sm:pt-5">
        Description
      </h2>
      <div className="px-4 pb-5 pt-3 text-[13.5px] leading-[1.8] text-muted sm:px-5">
        <p className="whitespace-pre-wrap">
          {specString ? <span className="font-bold text-text">{specString}.</span> : null}{" "}
          {body}
        </p>
      </div>
    </section>
  );
}

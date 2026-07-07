import CarCard from "@/components/CarCard";

export default function ScrollableCarGrid({ cars = [] }) {
  if (!cars.length) return null;

  const chunks = [];
  for (let i = 0; i < cars.length; i += 10) {
    chunks.push(cars.slice(i, i + 10));
  }

  return (
    <div className="overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-3 sm:-mx-5 md:-mx-6 lg:-mx-8 px-3 sm:px-5 md:px-6 lg:px-8">
      <div className="flex gap-2.5 sm:gap-4" style={{ minWidth: "100%" }}>
        {chunks.map((group, idx) => (
          <div
            key={idx}
            className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-4 flex-shrink-0 w-[calc(100vw-1.5rem)] sm:w-[calc(100vw-2.5rem)] md:w-[calc(100vw-3rem)] lg:w-[calc(100vw-4rem)] snap-start"
          >
            {group.map((car, i) => (
              <div key={car.id} className={i >= 4 ? "hidden lg:block" : ""}>
                <CarCard car={car} compact priority={idx === 0} />
              </div>
            ))}
            {group.length < 10 && Array.from({ length: 10 - group.length }).map((_, i) => (
              <div key={`empty-${i}`} className={group.length + i >= 4 ? "hidden lg:block" : ""} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

import { formatCarPrice } from "@/lib/utils";
import { buildCarDetailSpecRows, meaningfulFeatureList } from "@/lib/car-display";

export default function SpecSheet({ car, dealer }) {
  const title = `${car.year} ${car.make} ${car.model}${car.variant ? ` ${car.variant}` : ""}`;
  const primaryImg = car.images.find((i) => i.isPrimary) || car.images[0];
  const specs = buildCarDetailSpecRows(car);
  const printFeatures = meaningfulFeatureList(car.features).slice(0, 16);

  return (
    <div id="spec-sheet" className="hidden print:block bg-white text-black p-8 font-sans min-h-[297mm] w-[210mm] mx-auto border border-gray-100">
      {/* Header */}
      <div className="flex justify-between items-start border-b-4 border-orange-600 pb-6 mb-8 mt-4">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-black">
            Motor<span className="text-orange-600">ke</span>
          </h1>
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mt-1">
            Premium Secondary Marketplace · Kenya
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold uppercase tracking-widest text-gray-400">Inventory ID</p>
          <p className="text-lg font-black text-black">#{car.id.slice(-6).toUpperCase()}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-2 gap-8 mb-10">
        <div>
           {primaryImg && (
             <div className="aspect-[4/3] bg-gray-100 rounded-2xl overflow-hidden border border-gray-200">
               <img src={primaryImg.url} alt={title} className="w-full h-full object-cover" />
             </div>
           )}
           <div className="mt-8">
             <h3 className="text-xs font-bold uppercase tracking-widest text-orange-600 mb-2">Dealer Information</h3>
             <p className="text-xl font-black text-black">{dealer.name}</p>
             <p className="text-sm text-gray-600">{dealer.location}</p>
             <div className="mt-4 space-y-1">
               {dealer.phone && <p className="text-sm font-bold">📞 {dealer.phone}</p>}
               {dealer.email && <p className="text-sm font-bold">✉️ {dealer.email}</p>}
             </div>
           </div>
        </div>

        <div className="flex flex-col">
          <h2 className="text-3xl font-sans font-bold mb-2 leading-tight">{title}</h2>
          <div className="flex items-baseline gap-2 mb-8">
             <p className="text-4xl font-black text-orange-600">{formatCarPrice(car)}</p>
             {car.negotiable && <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">(Negotiable)</span>}
          </div>

          <div className="grid grid-cols-2 gap-y-4 gap-x-6 border-t border-gray-100 pt-6">
            {specs.map(({ label, value }) => (
              <div key={label} className="border-b border-gray-50 pb-2">
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">{label}</p>
                <p className="text-sm font-bold text-black">{value}</p>
              </div>
            ))}
          </div>

          {car.description && (
            <div className="mt-8">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Technical Description</p>
              <p className="text-xs text-gray-700 leading-relaxed line-clamp-[12]">{car.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Features */}
      {printFeatures.length > 0 && (
        <div className="mb-10">
          <h3 className="text-xs font-bold uppercase tracking-widest text-orange-600 mb-4">Included Features</h3>
          <div className="grid grid-cols-4 gap-2">
            {printFeatures.map((f) => (
              <div key={f} className="text-[11px] font-bold bg-gray-50 border border-gray-100 px-3 py-2 text-gray-700">
                • {f}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto pt-8 border-t border-gray-100 flex justify-between items-end">
        <div>
          <p className="text-[11px] text-gray-400 font-medium">Generated on {new Date().toLocaleDateString('en-KE', { dateStyle: 'long' })}</p>
          <p className="text-[11px] text-gray-400 font-medium">Visit welshmotorhub.co.ke for full listing and interactive comparison.</p>
        </div>
        <div className="bg-black text-white px-4 py-2 text-[11px] font-black uppercase tracking-tighter">
          Welsh Motorhub Showcase Cert.
        </div>
      </div>
    </div>
  );
}

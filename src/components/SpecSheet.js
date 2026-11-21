import { formatCarPrice } from "@/lib/utils";
import { buildCarDetailSpecRows } from "@/lib/car-display";
import { buildFeatureItems } from "@/lib/car-detail-fields";
import { getHeroImageUrl } from "@/lib/image-transform";

export default function SpecSheet({ car }) {
  const title = `${car.year} ${car.make} ${car.model}${car.variant ? ` ${car.variant}` : ""}`;
  const primaryImg = car.images.find((i) => i.isPrimary) || car.images[0];
  const specs = buildCarDetailSpecRows(car);
  // Same de-duplicated builder the on-screen Features section uses, so the
  // print sheet can never disagree with what the buyer just read.
  const printFeatures = buildFeatureItems(car, 16);

  return (
    <div id="spec-sheet" className="hidden print:block bg-surface text-black p-8 font-sans min-h-[297mm] w-[210mm] mx-auto border border-subtle">
      {/* Header */}
      <div className="flex justify-between items-start border-b-4 border-accent pb-6 mb-8 mt-4">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-black">
            BID<span className="text-accent">GARI</span>
          </h1>
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mt-1">
            Verified car marketplace, Kenya
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold uppercase tracking-widest text-dim">Inventory ID</p>
          <p className="text-lg font-black text-black">#{car.id.slice(-6).toUpperCase()}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-2 gap-8 mb-10">
        <div>
           {primaryImg && (
             <div className="aspect-[4/3] bg-gray-100 rounded-2xl overflow-hidden border border-border">
                <img src={getHeroImageUrl(primaryImg.url, 85, 800)} alt={title} className="w-full h-full object-cover" />
             </div>
           )}
           <div className="mt-8">
             <h3 className="text-xs font-bold uppercase tracking-widest text-accent mb-2">Sold by</h3>
             <p className="text-xl font-black text-black">BIDGARI</p>
              <p className="text-sm text-muted">Vehicle Sales &amp; Buyer Support, Kenya</p>
              <p className="mt-4 text-sm font-bold text-muted">Contact BIDGARI for more details.</p>
           </div>
        </div>

        <div className="flex flex-col">
          <h2 className="text-3xl font-sans font-bold mb-2 leading-tight">{title}</h2>
          <div className="flex items-baseline gap-2 mb-8">
             <p className="text-4xl font-black text-accent">{formatCarPrice(car)}</p>
             {car.negotiable && <span className="text-xs font-bold text-dim uppercase tracking-widest">(Negotiable)</span>}
          </div>

          <div className="grid grid-cols-2 gap-y-4 gap-x-6 border-t border-subtle pt-6">
            {specs.map(({ label, value }) => (
              <div key={label} className="border-b border-gray-50 pb-2">
                <p className="text-[9px] font-bold uppercase tracking-widest text-dim mb-0.5">{label}</p>
                <p className="text-sm font-bold text-black">{value}</p>
              </div>
            ))}
          </div>

          {car.description && (
            <div className="mt-8">
              <p className="text-[11px] font-bold uppercase tracking-widest text-dim mb-2">Technical Description</p>
              <p className="text-xs text-secondary leading-relaxed line-clamp-[12]">{car.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Features */}
      {printFeatures.length > 0 && (
        <div className="mb-10">
          <h3 className="text-xs font-bold uppercase tracking-widest text-accent mb-4">Included Features</h3>
          <div className="grid grid-cols-4 gap-2">
{printFeatures.map((f, i) => (
              <div key={`${f}-${i}`} className="text-[11px] font-bold bg-gray-50 border border-subtle px-3 py-2 text-secondary">
                , {f}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto pt-8 border-t border-subtle flex justify-between items-end">
        <div>
          <p className="text-[11px] text-dim font-medium">Generated on {new Date().toLocaleDateString('en-KE', { dateStyle: 'long' })}</p>
          <p className="text-[11px] text-dim font-medium">Visit BIDGARI for full listing and interactive comparison.</p>
        </div>
        <div className="bg-black text-white px-4 py-2 text-[11px] font-black uppercase tracking-tighter">
          BIDGARI Showcase Cert.
        </div>
      </div>
    </div>
  );
}

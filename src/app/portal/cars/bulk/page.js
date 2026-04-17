export const dynamic = "force-dynamic";
import { requireDealer } from "@/lib/auth";
import BulkUpload from "@/components/BulkUpload";

export const metadata = { title: "Bulk Upload Cars — Motorke Portal" };

export default async function PortalBulkUploadPage() {
  const user = await requireDealer();

  if (!user.dealer) {
    return (
      <div className="max-w-3xl rounded-none border border-amber-200 bg-amber-50 px-6 py-8">
        <h1 className="text-2xl font-black text-amber-900 tracking-tight">Dealer Setup Required</h1>
        <p className="mt-2 text-[11px] uppercase font-black tracking-[0.10em] font-semibold text-amber-800">
          Your account does not have a linked dealer profile yet. Complete profile setup to use bulk upload.
        </p>
        <a href="/portal/profile" className="mt-5 inline-flex rounded-none bg-amber-600 px-5 py-2.5 text-[10px] uppercase font-black tracking-[0.15em] font-black uppercase tracking-wider text-slate-900">
          Open Profile Setup
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-5xl animate-in fade-in duration-700">
      <div className="mb-10">
        <a href="/portal/cars/new" className="text-[10px] uppercase font-black tracking-[0.15em] font-black uppercase tracking-wider text-slate-700 hover:text-[#ff5a2f]">← Back to New Car</a>
        <h1 className="mt-3 text-4xl font-black text-slate-900 tracking-tight">Bulk Upload Cars</h1>
        <p className="mt-2 text-[11px] uppercase font-black tracking-[0.10em] font-semibold text-slate-700">
          Upload many cars at once using CSV. Use the template to avoid format errors.
        </p>
      </div>

      <div className="mb-8 rounded-none border border-[#ddd4c8] bg-white px-6 py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] uppercase font-black tracking-[0.10em] font-bold text-slate-900">Start with the template</p>
            <p className="text-[10px] uppercase font-black tracking-[0.15em] font-semibold text-slate-700 mt-1">Fill the sample columns, then import your file below.</p>
          </div>
          <a href="/api/portal/cars/bulk/template" className="inline-flex rounded-none bg-[#111111] px-4 py-2.5 text-[10px] uppercase font-black tracking-[0.15em] font-black uppercase tracking-wider text-white hover:bg-[#111111]">
            Download Template
          </a>
        </div>
      </div>

      <BulkUpload dealers={[user.dealer]} mode="DEALER" />
    </div>
  );
}

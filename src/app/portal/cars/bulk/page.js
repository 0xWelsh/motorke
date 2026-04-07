export const dynamic = "force-dynamic";
import { requireDealer } from "@/lib/auth";
import BulkUpload from "@/components/BulkUpload";

export const metadata = { title: "Bulk Upload Cars — Motorke Portal" };

export default async function PortalBulkUploadPage() {
  const user = await requireDealer();

  if (!user.dealer) {
    return (
      <div className="max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 px-6 py-8">
        <h1 className="text-2xl font-black text-amber-900 tracking-tight">Dealer Setup Required</h1>
        <p className="mt-2 text-sm font-semibold text-amber-800">
          Your account does not have a linked dealer profile yet. Complete profile setup to use bulk upload.
        </p>
        <a href="/portal/profile" className="mt-5 inline-flex rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white">
          Open Profile Setup
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-5xl animate-in fade-in duration-700">
      <div className="mb-10">
        <a href="/portal/cars/new" className="text-xs font-black uppercase tracking-wider text-slate-500 hover:text-emerald-600">← Back to New Car</a>
        <h1 className="mt-3 text-4xl font-black text-slate-900 tracking-tight">Bulk Upload Cars</h1>
        <p className="mt-2 text-sm font-semibold text-slate-500">
          Upload many cars at once using CSV. Use the template to avoid format errors.
        </p>
      </div>

      <div className="mb-8 rounded-2xl border border-slate-200 bg-white px-6 py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-slate-900">Start with the template</p>
            <p className="text-xs font-semibold text-slate-500 mt-1">Fill the sample columns, then import your file below.</p>
          </div>
          <a href="/api/portal/cars/bulk/template" className="inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white hover:bg-slate-800">
            Download Template
          </a>
        </div>
      </div>

      <BulkUpload dealers={[user.dealer]} mode="DEALER" />
    </div>
  );
}

// src/app/admin/cars/bulk/page.js
export const dynamic = "force-dynamic";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import BulkUpload from "@/components/BulkUpload";

export const metadata = { title: "Bulk Upload Cars — Admin" };

export default async function BulkUploadPage() {
  await requireAdmin();
  const dealers = await db.dealer.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, location: true } });

  return (
    <div style={{ padding: "28px 32px", maxWidth: 900 }}>
      <div style={{ marginBottom: 28 }}>
        <a href="/admin" style={{ fontSize: 12, color: "#999", textDecoration: "none" }}>← Dashboard</a>
        <h1 style={{ fontWeight: 800, fontSize: "1.6rem", color: "#0A2640", marginTop: 8 }}>Bulk upload cars</h1>
        <p style={{ color: "#666", fontSize: 14, marginTop: 4 }}>Upload multiple car listings at once using a CSV or Excel file</p>
      </div>

      {/* Template download */}
      <div style={{ background: "#e8eef4", border: "1.5px solid #c5d5e8", borderRadius: 14, padding: "18px 24px", marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: 14, color: "#0A2640" }}>📄 Download the template first</p>
          <p style={{ fontSize: 13, color: "#555", marginTop: 3 }}>Fill in the CSV template with your car data, then upload it below.</p>
        </div>
        <a href="/api/cars/bulk/template" style={{ background: "#0A2640", color: "white", textDecoration: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
          Download template
        </a>
      </div>

      {/* Column guide */}
      <div style={{ background: "#fff", border: "1px solid #E2E2E2", borderRadius: 14, padding: "20px 24px", marginBottom: 28 }}>
        <h2 style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0A2640", marginBottom: 14 }}>Column reference</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 10 }}>
          {[
            { col: "make *",         eg: "Toyota"       },
            { col: "model *",        eg: "Hilux"        },
            { col: "variant",        eg: "Double Cab 4x4" },
            { col: "year *",         eg: "2021"         },
            { col: "price *",        eg: "4500000"      },
            { col: "mileage",        eg: "45000"        },
            { col: "fuelType *",     eg: "PETROL / DIESEL / HYBRID" },
            { col: "transmission *", eg: "AUTOMATIC / MANUAL / CVT" },
            { col: "bodyType *",     eg: "SUV / SEDAN / PICKUP / HATCHBACK / WAGON" },
            { col: "engineCC",       eg: "2755"         },
            { col: "color",          eg: "Pearl White"  },
            { col: "seats",          eg: "5"            },
            { col: "drivetrain",     eg: "FWD / RWD / AWD / FOURWD" },
            { col: "steering",       eg: "RHD / LHD" },
            { col: "features",       eg: "Sunroof;Leather;Camera" },
            { col: "description",    eg: "One owner, full service history" },
            { col: "imageUrl",       eg: "https://..." },
            { col: "registered",     eg: "true / false (Kenya)" },
            { col: "imported",       eg: "true / false" },
            { col: "importCountry",  eg: "Japan" },
          ].map(({ col, eg }) => (
            <div key={col} style={{ background: "#F5F5F5", borderRadius: 8, padding: "8px 12px" }}>
              <p style={{ fontWeight: 700, fontSize: 12, color: "#0A2640" }}>{col}</p>
              <p style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{eg}</p>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: "#999", marginTop: 14 }}>
          * Required fields. Separate multiple features with a semicolon (;). Each bulk CSV must include at least 3
          cars—use the single-car form for one or two listings.
        </p>
      </div>

      {/* Upload component */}
      <BulkUpload dealers={dealers} mode="ADMIN" />
    </div>
  );
}

export const dynamic = "force-dynamic";

import { getSessionFromRequest } from "@/lib/auth";
import { generateDutyCrspTemplateCsv } from "@/lib/duty-crsp-import";

export async function GET(request) {
  const session = await getSessionFromRequest();
  if (!session || session.user.role !== "ADMIN") {
    return new Response("Unauthorized", { status: 401 });
  }

  const csv = generateDutyCrspTemplateCsv();
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="duty-crsp-template.csv"',
    },
  });
}

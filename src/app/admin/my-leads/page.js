import { redirect } from "next/navigation";

export default function MyLeadsRedirect() {
  redirect("/admin/leads?mine=1");
}

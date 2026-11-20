import { redirect } from "next/navigation";

// The dealer concept is gone — BIDGARI is the single seller. Keep the URL
// alive for inbound links/SEO juice and send it where the cars are.
export default function DealersPage() {
  redirect("/cars");
}

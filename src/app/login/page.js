export const dynamic = "force-dynamic";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";

export const metadata = { title: "Sign In | Welsh Motorhub" };

export default async function LoginPage(props) {
  let searchParams = {};
  if (props.searchParams) {
    if (typeof props.searchParams.then === "function") {
      searchParams = await props.searchParams;
    } else {
      searchParams = props.searchParams;
    }
  }

  let session = null;
  try {
    session = await getSession();
  } catch (err) {
    console.error("Error fetching session:", err);
  }

  const role = session?.user?.role;
  if (role === "ADMIN") redirect("/admin");
  if (role) redirect("/");

  const error = searchParams?.error || null;

  return <LoginForm error={error} />;
}

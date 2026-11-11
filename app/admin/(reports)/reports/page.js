import { redirect } from "next/navigation";

// The report links now live on the admin home page.
export default function ReportsRedirect() {
  redirect("/admin/");
}

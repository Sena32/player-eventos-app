import { redirect } from "next/navigation";

export default function DashboardHomePage() {
  redirect("/events");
}

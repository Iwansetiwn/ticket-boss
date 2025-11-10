import SignUpForm from "@/components/auth/SignUpForm";
import { getCurrentUser } from "@/lib/auth";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Ticket Monitoring SignUp Page | Ticket Monitoring - Ticket Monitoring Dashboard Template",
  description: "This is Ticket Monitoring SignUp Page Ticket Monitoring Dashboard Template",
};

export default async function SignUp() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/");
  }
  return <SignUpForm />;
}

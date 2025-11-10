import SignInForm from "@/components/auth/SignInForm";
import { getCurrentUser } from "@/lib/auth";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Ticket Monitoring SignIn Page | Ticket Monitoring - Ticket Monitoring Dashboard Template",
  description: "This is Ticket Monitoring Signin Page Ticket Monitoring Dashboard Template",
};

export default async function SignIn() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/");
  }
  return <SignInForm />;
}

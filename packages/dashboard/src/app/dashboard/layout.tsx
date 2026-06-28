import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import Navbar from "@/components/Navbar/Navbar";
import { NotificationProvider } from "@/components/NotificationProvider/NotificationProvider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <SessionProvider session={session}>
      <NotificationProvider>
        <main>{children}</main>
        <Navbar />
      </NotificationProvider>
    </SessionProvider>
  );
}

import SessionProvider from "@/components/session-provider";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <div className="lg:pl-[260px] transition-all duration-300">
          <Header />
          <main className="p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </SessionProvider>
  );
}
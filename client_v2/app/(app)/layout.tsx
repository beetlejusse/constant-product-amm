import { AppNav } from "@/components/app/AppNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Backdrop } from "@/components/Backdrop";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Backdrop />
      <AppNav />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

import { AdminNav } from "@/components/admin/admin-nav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="phone-shell">
      <div className="no-scrollbar flex-1 overflow-y-auto">{children}</div>
      <AdminNav />
    </div>
  );
}

import { ResidentNav } from "@/components/resident/resident-nav";

export default function ResidentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="phone-shell">
      <div className="no-scrollbar flex flex-1 flex-col overflow-y-auto">{children}</div>
      <ResidentNav />
    </div>
  );
}

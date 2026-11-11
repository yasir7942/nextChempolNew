import AdminNav from "@/app/admin/shared/components/admin-nav";

// Shared by /admin/reports/ and the report pages (the route group doesn't change the URLs).
// Login and the admin header come from app/admin/layout.js.
export default function ReportsLayout({ children }) {
  return (
    <>
      <AdminNav />
      {children}
    </>
  );
}

// Shared by /admin/reports/ and the report pages (the route group doesn't change the URLs).
// Login and the admin header (with the Reports menu) come from app/admin/layout.js.
export default function ReportsLayout({ children }) {
  return <>{children}</>;
}

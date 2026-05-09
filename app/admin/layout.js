import AdminHeader from "./shared/AdminHeader";

export default function AdminLayout({ children }) {
    return (
        <div className="min-h-screen bg-gray-100">
            <AdminHeader />
            {children}
        </div>
    );
}
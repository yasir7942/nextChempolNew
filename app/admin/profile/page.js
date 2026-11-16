import PaddingContainer from "@/app/admin/shared/components/padding-container";
import ProfileAccount from "@/app/admin/shared/components/profile-account";
import { ADMIN_ROBOTS } from "@/app/admin/admin-pages";

export const metadata = {
    title: "My Profile",
    description: "Admin profile and password",
    robots: ADMIN_ROBOTS,
};

const Profile = () => (
    <div className="w-full h-auto bg-gray-50 pt-10 pb-16">
        <PaddingContainer>
            <div className="border-b border-gray-200 pb-6">
                <p className="text-sm font-medium uppercase tracking-wider text-[#BE1D21]">SuperAdmin</p>
                <h1 className="mt-1 text-3xl font-semibold text-gray-900">My Profile</h1>
            </div>
            <ProfileAccount />
        </PaddingContainer>
    </div>
);

export default Profile;

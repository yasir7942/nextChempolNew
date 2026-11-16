import PaddingContainer from "@/app/admin/shared/components/padding-container";
import SubmissionsReport from "@/app/admin/shared/components/submissions-report";
import { ADMIN_ROBOTS } from "@/app/admin/admin-pages";

export const metadata = {
    title: "Customer Submissions",
    description: "Customer Submissions",
    robots: ADMIN_ROBOTS,
};

const Submissions = () => {
    return (
        <div className="w-full h-auto bg-gray-50 pt-10 pb-16">
            <PaddingContainer>
                <div className="border-b border-gray-200 pb-6">
                    <p className="text-sm font-medium uppercase tracking-wider text-[#BE1D21]">Private database · SuperAdmin only</p>
                    <h1 className="mt-1 text-3xl font-semibold text-gray-900">Customer Submissions</h1>
                    <p className="mt-2 max-w-3xl text-gray-600">
                        Every contact, quote, sample and technical-team request from the website. Each one is saved before the email is sent, so nothing is lost.
                        &quot;Not sent&quot; means the notification email failed and the team has not been told yet.
                    </p>
                </div>

                <SubmissionsReport />
            </PaddingContainer>
        </div>
    );
};

export default Submissions;

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PaddingContainer from "@/app/admin/shared/components/padding-container";
import { ADMIN_PAGES, ADMIN_ROBOTS } from "@/app/admin/admin-pages";

export const metadata = {
  title: "Admin Dashboard",
  description: "Admin reports for products, redirects and YouTube videos.",
  robots: ADMIN_ROBOTS,
};

const AdminDashboard = () => {
  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      <section className="border-b border-slate-200 bg-white">
        <PaddingContainer>
          <div className="py-8 md:py-10">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-700">Reports</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">Admin Dashboard</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
              Reports for checking product data, redirects and YouTube videos. All read live data from Strapi.
            </p>
          </div>
        </PaddingContainer>
      </section>

      <section className="py-6 md:py-10">
        <PaddingContainer>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {ADMIN_PAGES.map(({ href, title, description, Icon }) => (
              <Link
                key={href}
                href={href}
                className="group flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-red-200 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-red-700"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="rounded-2xl bg-red-50 p-3 text-red-700">
                    <Icon className="h-6 w-6" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-red-700" />
                </div>

                <h2 className="mt-5 text-xl font-bold text-slate-950">{title}</h2>
                <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{description}</p>

                <span className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition group-hover:bg-red-700">
                  Open {title}
                </span>
              </Link>
            ))}
          </div>
        </PaddingContainer>
      </section>
    </div>
  );
};

export default AdminDashboard;

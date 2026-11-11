import PaddingContainer from "@/app/admin/shared/components/padding-container";
import ReadProductReport from "@/app/admin/shared/components/product-report";
import { ADMIN_ROBOTS } from "@/app/admin/admin-pages";

// Rendered on every request; the product data itself is loaded in the browser from
// /api/admin/product-report/ (always fresh, with a Refresh button)
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Product Report",
  description:
    "Professional product category audit report for checking product placement, missing media, empty categories and uncategorized products.",
  robots: ADMIN_ROBOTS,
};

const ProductReport = () => {
  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      <section className="border-b border-slate-200 bg-white">
        <PaddingContainer>
          <div className="py-4 md:py-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-700">
                  Product Data Audit
                </p>

                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
                  Product Report
                </h1>

                <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                  Review product category placement, empty categories, missing
                  category media and uncategorized products in one professional
                  reporting screen.
                </p>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
                <p className="font-bold">Recommended View</p>
                <p className="mt-0.5 text-amber-700">
                  Use desktop browser for best table readability.
                </p>
              </div>
            </div>
          </div>
        </PaddingContainer>
      </section>

      <section className="py-6 md:py-8">
        <PaddingContainer>
          <ReadProductReport />
        </PaddingContainer>
      </section>
    </div>
  );
};

export default ProductReport;
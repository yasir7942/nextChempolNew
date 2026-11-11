"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MagnifyingGlass } from "react-loader-spinner";
import {
    AlertTriangle,
    FileBarChart2,
    FolderTree,
    EyeOff,
    FileText,
    Languages,
    MessageCircleQuestion,
    Package,
    PackageCheck,
    RefreshCw,
    SearchX,
    ShieldAlert,
} from "lucide-react";

import ProductReportTable from "@/app/admin/shared/components/product-report-table";

const REPORT_ENDPOINT = "/api/admin/product-report/";

async function loadReport(signal) {
    const response = await fetch(REPORT_ENDPOINT, { cache: "no-store", signal });
    const json = await response.json().catch(() => null);

    if (!response.ok || !json?.success) {
        throw new Error(json?.error || `Could not load the product report (HTTP ${response.status}).`);
    }

    return json;
}


// Compact figure tile: title, one number and a short note
const StatCard = ({ title, value, description, icon: Icon, tone = "slate" }) => {
    const toneClasses = {
        slate: "border-slate-200 bg-white text-slate-900",
        green: "border-emerald-200 bg-emerald-50 text-emerald-900",
        amber: "border-amber-200 bg-amber-50 text-amber-900",
        red: "border-red-200 bg-red-50 text-red-900",
    };

    return (
        <div className={`rounded-xl border px-3 py-2.5 ${toneClasses[tone]}`}>
            <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium opacity-75">{title}</p>
                <Icon className="h-4 w-4 shrink-0 opacity-60" />
            </div>
            <p className="mt-0.5 text-2xl font-bold leading-tight">{value}</p>
            {description && <p className="text-[11px] leading-4 opacity-75">{description}</p>}
        </div>
    );
};

const SectionTitle = ({ icon: Icon, title, description, tone = "slate" }) => {
    const toneClasses = {
        slate: "bg-slate-50 text-slate-900 border-slate-200",
        green: "bg-emerald-50 text-emerald-900 border-emerald-200",
        amber: "bg-amber-50 text-amber-900 border-amber-200",
        red: "bg-red-50 text-red-900 border-red-200",
        orange: "bg-orange-50 text-orange-900 border-orange-200",
    };

    return (
        <div className={`border-b px-5 py-5 md:px-6 ${toneClasses[tone]}`}>
            <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-white/70 p-3 shadow-sm">
                    <Icon className="h-5 w-5" />
                </div>

                <div>
                    <h2 className="text-xl font-bold">{title}</h2>
                    {description && (
                        <p className="mt-1 text-sm leading-6 opacity-80">
                            {description}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

const ReadProductReport = () => {
    // { categories, uncategorized, fetchedAt } from REPORT_ENDPOINT
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // The refresh card lives in the page header (app/admin/(reports)/product-report/page.js)
    const [refreshSlot, setRefreshSlot] = useState(null);
    useEffect(() => {
        setRefreshSlot(document.getElementById("product-report-refresh"));
    }, []);
    const requestRef = useRef(null);

    const categories = useMemo(() => {
        return Array.isArray(report?.categories) ? report.categories : [];
    }, [report]);

    // Always fresh data; a newer request cancels an older one still in flight
    const fetchReport = useCallback(() => {
        requestRef.current?.abort();
        const controller = new AbortController();
        requestRef.current = controller;

        return loadReport(controller.signal)
            .then(
                (json) => {
                    setReport(json);
                    setError(null);
                },
                (e) => {
                    if (e.name === "AbortError") return;
                    setError(e);
                    console.error("Product report loading error:", e);
                }
            )
            .finally(() => {
                if (requestRef.current === controller) {
                    requestRef.current = null;
                    setLoading(false);
                }
            });
    }, []);

    useEffect(() => {
        fetchReport();
        return () => requestRef.current?.abort();
    }, [fetchReport]);

    const refresh = () => {
        if (loading) return;
        setLoading(true);
        fetchReport();
    };

    const getProductCount = (category) => {
        return Array.isArray(category?.products?.data)
            ? category.products.data.length
            : 0;
    };

    // Chempol categories are flat (no parent/child): products belong directly to a category
    const totalCategories = categories.length;

    const emptyCategories = categories.filter((category) => {
        return getProductCount(category) === 0;
    });


    // First load: full waiting screen. A refresh keeps the current report visible.
    if (!report && loading) {
        return (
            <div className="flex min-h-[380px] flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <div className="rounded-full bg-red-50 p-5">
                    <FileBarChart2 className="h-10 w-10 text-red-700" />
                </div>

                <h2 className="mt-5 text-2xl font-bold text-slate-950">
                    Preparing product report
                </h2>

                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                    Checking product categories and product placement.
                </p>

                <div className="mt-6">
                    <MagnifyingGlass
                        visible={true}
                        height="80"
                        width="80"
                        ariaLabel="magnifying-glass-loading"
                        wrapperClass="magnifying-glass-wrapper"
                        glassColor="#FFFFFF"
                        color="#BE1D21"
                    />
                </div>
            </div>
        );
    }

    if (!report && error) {
        return (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
                <div className="flex items-start gap-3">
                    <ShieldAlert className="mt-0.5 h-6 w-6 shrink-0 text-red-700" />

                    <div>
                        <h2 className="text-lg font-bold text-red-900">
                            Unable to load product report
                        </h2>

                        <p className="mt-1 text-sm leading-6 text-red-700">
                            {error?.message || "Something went wrong while loading report."}
                        </p>

                        <button
                            type="button"
                            onClick={refresh}
                            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
                        >
                            <RefreshCw className="h-4 w-4" /> Try again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const uncategorizedProducts = Array.isArray(report?.uncategorized) ? report.uncategorized : [];
    const needsReview = emptyCategories.length > 0 || uncategorizedProducts.length > 0;

    // Every live product once (a product in 2 categories counts once); drafts are hidden in the tables too
    const allProducts = [...new Map(
        [...categories.flatMap((category) => category.products?.data || []), ...uncategorizedProducts]
            .filter((item) => item.publishedAt !== null)
            .map((item) => [item.id, item])
    ).values()];
    const countProducts = (test) => allProducts.filter(test).length;
    const noShortDescription = countProducts((item) => !item.hasShortDescription);
    const noSeo = countProducts((item) => !item.seoTitle || !item.seoDescription);
    const blockedFromIndex = countProducts((item) => item.blockIndex);
    const noFaq = countProducts((item) => !item.faqCount);
    const translationFigures = (locale) => {
        const incomplete = countProducts((item) => item.translations?.[locale]?.status === "incomplete");
        const none = countProducts((item) => item.translations?.[locale]?.status === "none");
        return { incomplete, none, total: incomplete + none };
    };
    const arabic = translationFigures("ar");
    const spanish = translationFigures("es");
    const toneFor = (count, bad = "amber") => (count > 0 ? bad : "green");

    return (
        <div className="space-y-7 font-serif">
            {/* Refresh card: shown in the page header */}
            {refreshSlot && createPortal(
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <p className="text-sm text-slate-500">
                    Live data from Strapi
                    {report?.fetchedAt && (
                        <> · Updated <span className="font-semibold text-slate-700">{new Date(report.fetchedAt).toLocaleString()}</span></>
                    )}
                </p>
                    <div className="mt-2">
                        <button
                    type="button"
                    onClick={refresh}
                    disabled={loading}
                    aria-busy={loading}
                    className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    {loading ? "Refreshing…" : "Refresh"}
                </button>
                    </div>
                </div>,
                refreshSlot
            )}

            {/* Refresh failed: the last loaded data stays on screen */}
            {error && (
                <div className="flex items-start gap-3 rounded-3xl border border-red-200 bg-red-50 p-5 shadow-sm">
                    <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
                    <p className="text-sm leading-6 text-red-700">
                        <span className="font-bold text-red-900">Refresh failed.</span> {error.message} Showing the data loaded at{" "}
                        {new Date(report.fetchedAt).toLocaleString()}.
                    </p>
                </div>
            )}

            {/* Report Summary */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <StatCard
                    title="Categories"
                    value={totalCategories}
                    description={`${emptyCategories.length} empty`}
                    icon={FolderTree}
                    tone={toneFor(emptyCategories.length, "red")}
                />
                <StatCard
                    title="Products"
                    value={allProducts.length}
                    description={`${uncategorizedProducts.length} without a category`}
                    icon={Package}
                    tone={toneFor(uncategorizedProducts.length, "red")}
                />
                <StatCard
                    title="No Short Description"
                    value={noShortDescription}
                    description="products to fill"
                    icon={FileText}
                    tone={toneFor(noShortDescription)}
                />
                <StatCard
                    title="Missing SEO"
                    value={noSeo}
                    description="no SEO title or description"
                    icon={SearchX}
                    tone={toneFor(noSeo)}
                />
                <StatCard
                    title="Block Index"
                    value={blockedFromIndex}
                    description="hidden from search engines"
                    icon={EyeOff}
                    tone={blockedFromIndex > 0 ? "amber" : "slate"}
                />
                <StatCard
                    title="No FAQs"
                    value={noFaq}
                    description="products without FAQs"
                    icon={MessageCircleQuestion}
                    tone="slate"
                />
                <StatCard
                    title="Arabic"
                    value={arabic.total}
                    description={`${arabic.incomplete} incomplete, ${arabic.none} missing`}
                    icon={Languages}
                    tone={toneFor(arabic.total)}
                />
                <StatCard
                    title="Spanish"
                    value={spanish.total}
                    description={`${spanish.incomplete} incomplete, ${spanish.none} missing`}
                    icon={Languages}
                    tone={toneFor(spanish.total)}
                />
                <StatCard
                    title="Audit Status"
                    value={needsReview ? "Review" : "Good"}
                    description={needsReview ? "empty or uncategorized" : "all products placed"}
                    icon={PackageCheck}
                    tone={needsReview ? "amber" : "green"}
                />
            </div>

            {/* Products that exist only in Arabic / only in Spanish */}
            {[
                { locale: "ar", name: "Arabic" },
                { locale: "es", name: "Spanish" },
            ].map(({ locale, name }) => {
                const items = Array.isArray(report?.translationOnly?.[locale]) ? report.translationOnly[locale] : [];

                // Nothing to review for this language: no section
                if (items.length === 0) return null;

                return (
                    <section key={locale} className="overflow-hidden rounded-3xl border border-sky-200 bg-white shadow-sm">
                        <SectionTitle
                            icon={AlertTriangle}
                            title={`${name} products without an English version (${items.length})`}
                            description={`These products exist only in ${name}. Create the English version in Strapi, or delete the product if it is not needed.`}
                            tone="amber"
                        />

                        <div className="p-5 md:p-6">
                                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                                    <table className="w-full table-auto border-collapse text-sm">
                                        <thead>
                                            <tr className="bg-slate-50 text-left">
                                                <th className="border border-gray-300 px-2 py-1 text-center">P. Id</th>
                                                <th className="border border-gray-300 px-2 py-1">Title</th>
                                                <th className="border border-gray-300 px-2 py-1">Slug</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map((item) => (
                                                <tr key={item.documentId || item.id}>
                                                    <td className="border border-gray-300 px-2 py-1 text-center font-semibold">{item.id}</td>
                                                    <td className="border border-gray-300 px-2 py-1 font-light" dir={locale === "ar" ? "rtl" : "ltr"}>{item.title}</td>
                                                    <td className="break-all border border-gray-300 px-2 py-1 font-mono text-xs font-light">{item.slug}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                        </div>
                    </section>
                );
            })}

            {/* Categories Needing Review */}
            {emptyCategories.length > 0 && (
                <div className="rounded-3xl border border-red-200 bg-white shadow-sm">
                    <SectionTitle
                        icon={ShieldAlert}
                        title="Categories Needing Review"
                        description="These categories have no products. Assign products to them in Strapi, or unpublish them."
                        tone="red"
                    />

                    <div className="p-5 md:p-6">
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {emptyCategories.map((category) => (
                                <div
                                    key={category.id}
                                    className="rounded-2xl border border-red-200 bg-red-50 p-4"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h3 className="font-bold text-red-950">
                                                {category.title || "No Title"}
                                            </h3>

                                            <p className="mt-1 text-xs leading-5 text-red-700">
                                                Add products to this category.
                                            </p>
                                        </div>

                                        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-red-700 shadow-sm">
                                            0 products
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {categories.length === 0 && (
                <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                    <Package className="mx-auto h-12 w-12 text-slate-300" />

                    <h2 className="mt-4 text-xl font-bold text-slate-950">
                        No report data found
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                        No product categories are available for this report.
                    </p>
                </div>
            )}

            {/* Category Reports */}
            <div className="space-y-8">
                {categories.map((category) => {
                    const productCount = getProductCount(category);
                    const isEmpty = productCount === 0;

                    return (
                        <section
                            key={category.id}
                            className={`overflow-hidden rounded-3xl border bg-white shadow-sm ${isEmpty ? "border-red-200" : "border-slate-200"
                                }`}
                        >
                            {/* Category Header */}
                            <div
                                className={`border-b px-5 py-5 md:px-6 ${isEmpty
                                    ? "border-red-200 bg-red-50"
                                    : "border-slate-200 bg-white"
                                    }`}
                            >
                                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Product Category</p>

                                        <h2 className="mt-1 text-2xl font-bold text-slate-950">
                                            {category.title || "No Title"}
                                        </h2>

                                        <p className="mt-1 text-sm text-slate-600">
                                            {category.index ? <>Index: {category.index}<span className="mx-2 text-slate-300">|</span></> : null}
                                            {category.slug ? <>Slug: {category.slug}<span className="mx-2 text-slate-300">|</span></> : null}
                                            <span className={isEmpty ? "font-semibold text-red-700" : ""}>
                                                {isEmpty ? "No products" : `${productCount} product${productCount > 1 ? "s" : ""}`}
                                            </span>
                                        </p>

                                        {isEmpty && (
                                            <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-red-700">
                                                Warning: this category has no products. Assign products to it
                                                in Strapi.
                                            </p>
                                        )}
                                    </div>

                                </div>
                            </div>

                            {/* Category Products */}
                            <div className="p-5 md:p-6">
                                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                                    <ProductReportTable
                                        Type="child"
                                        products={category.products?.data}
                                        postCount={category.postCount}
                                    />
                                </div>
                            </div>
                        </section>
                    );
                })}
            </div>

            {/* Uncategorized Products */}
            <section className="overflow-hidden rounded-3xl border border-orange-200 bg-white shadow-sm">
                <SectionTitle
                    icon={AlertTriangle}
                    title="Uncategorized Products"
                    description="Products listed here are not assigned to a product category. Assign them to the correct category in Strapi."
                    tone="orange"
                />

                <div className="p-5 md:p-6">
                    <div className="overflow-x-auto rounded-2xl border border-orange-200">
                        <ProductReportTable
                            Type="uncategorized"
                            products={uncategorizedProducts}
                        />
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ReadProductReport;
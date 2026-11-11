"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { MagnifyingGlass } from "react-loader-spinner";
import {
    AlertTriangle,
    CheckCircle2,
    CircleAlert,
    FileBarChart2,
    FolderTree,
    ImageOff,
    Layers3,
    Package,
    PackageCheck,
    RefreshCw,
    ShieldAlert,
} from "lucide-react";

import ProductReportTable from "@/app/admin/shared/components/product-report-table";
import { getImageUrl } from "@/libs/helper";

const REPORT_ENDPOINT = "/api/admin/product-report/";

async function loadReport(signal) {
    const response = await fetch(REPORT_ENDPOINT, { cache: "no-store", signal });
    const json = await response.json().catch(() => null);

    if (!response.ok || !json?.success) {
        throw new Error(json?.error || `Could not load the product report (HTTP ${response.status}).`);
    }

    return json;
}

const hasMedia = (media) => {
    return Boolean(media?.url && String(media.url).trim() !== "");
};

const StatCard = ({
    title,
    value,
    description,
    icon: Icon,
    tone = "slate",
}) => {
    const toneClasses = {
        slate: "border-slate-200 bg-white text-slate-900",
        blue: "border-blue-200 bg-blue-50 text-blue-900",
        green: "border-emerald-200 bg-emerald-50 text-emerald-900",
        amber: "border-amber-200 bg-amber-50 text-amber-900",
        red: "border-red-200 bg-red-50 text-red-900",
    };

    const iconClasses = {
        slate: "bg-slate-100 text-slate-700",
        blue: "bg-blue-100 text-blue-700",
        green: "bg-emerald-100 text-emerald-700",
        amber: "bg-amber-100 text-amber-700",
        red: "bg-red-100 text-red-700",
    };

    return (
        <div
            className={`rounded-3xl border p-5 shadow-sm ${toneClasses[tone]}`}
        >
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium opacity-75">{title}</p>
                    <p className="mt-2 text-3xl font-bold">{value}</p>
                    {description && (
                        <p className="mt-2 text-xs leading-5 opacity-75">
                            {description}
                        </p>
                    )}
                </div>

                <div className={`rounded-2xl p-3 ${iconClasses[tone]}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
};

const MediaCard = ({
    title,
    media,
    alt,
    sizeClass = "w-14",
    zoomClass = "hover:scale-[7]",
}) => {
    if (!hasMedia(media)) {
        return (
            <div className="flex min-h-[92px] min-w-[112px] flex-col items-center justify-center rounded-2xl border border-dashed border-red-200 bg-red-50 px-3 py-3 text-center">
                <ImageOff className="h-5 w-5 text-red-500" />
                <p className="mt-2 text-xs font-bold text-red-700">Missing</p>
                <p className="mt-0.5 text-[11px] text-red-500">{title}</p>
            </div>
        );
    }

    return (
        <figure className="group flex min-h-[92px] min-w-[112px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
            <Image
                className={`${sizeClass} ${zoomClass} rounded-lg object-contain transition-transform duration-300 group-hover:z-30 group-hover:cursor-pointer`}
                src={getImageUrl(media.url)}
                height={250}
                width={250}
                alt={alt || title}
                priority
            />

            <figcaption className="mt-2 text-center text-[11px] font-semibold text-slate-500">
                {title}
            </figcaption>
        </figure>
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

    const totalCategoryProducts = categories.reduce((total, category) => {
        return total + getProductCount(category);
    }, 0);

    const emptyCategories = categories.filter((category) => {
        return getProductCount(category) === 0;
    });

    const categoriesWithProducts = totalCategories - emptyCategories.length;

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
                    Checking product categories, product placement, category banners
                    and missing media.
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

    return (
        <div className="space-y-7 font-serif">
            {/* Toolbar */}
            <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                    Live data from Strapi
                    {report?.fetchedAt && (
                        <> · Updated <span className="font-semibold text-slate-700">{new Date(report.fetchedAt).toLocaleString()}</span></>
                    )}
                </p>

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
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <StatCard
                    title="Categories"
                    value={totalCategories}
                    description="Product categories in Strapi"
                    icon={FolderTree}
                    tone="slate"
                />

                <StatCard
                    title="Category Products"
                    value={totalCategoryProducts}
                    description="Products listed in categories (a product in 2 categories counts twice)"
                    icon={Layers3}
                    tone="blue"
                />

                <StatCard
                    title="Categories With Products"
                    value={categoriesWithProducts}
                    description="Categories that list products"
                    icon={CheckCircle2}
                    tone="green"
                />

                <StatCard
                    title="Empty Categories"
                    value={emptyCategories.length}
                    description="Categories without any product"
                    icon={AlertTriangle}
                    tone={emptyCategories.length > 0 ? "red" : "green"}
                />

                <StatCard
                    title="Audit Status"
                    value={needsReview ? "Review" : "Good"}
                    description={
                        needsReview
                            ? "Some categories or products need attention"
                            : "Every product is in a category"
                    }
                    icon={PackageCheck}
                    tone={needsReview ? "amber" : "green"}
                />
            </div>

            {/* Report Rule */}
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="rounded-2xl bg-white p-3 shadow-sm">
                            <CircleAlert className="h-6 w-6 text-amber-700" />
                        </div>

                        <div>
                            <h2 className="text-lg font-bold text-amber-950">
                                Product placement rule
                            </h2>

                            <p className="mt-1 max-w-5xl text-sm leading-6 text-amber-800">
                                Every product should be assigned to a product category. Chempol
                                categories have no parent or child levels, so products listed in a
                                category are correctly placed. Empty categories and products
                                without a category need review.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                            Empty category = Review
                        </span>

                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                            Category products = Correct
                        </span>

                        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
                            Uncategorized = Reassign
                        </span>
                    </div>
                </div>
            </div>

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
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-bold text-white">
                                                Product Category
                                            </span>

                                            {category.index && (
                                                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                                                    Index: {category.index}
                                                </span>
                                            )}

                                            {category.slug && (
                                                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                                                    Slug: {category.slug}
                                                </span>
                                            )}

                                            {isEmpty ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                                                    <AlertTriangle className="h-3.5 w-3.5" />
                                                    No products
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                    {productCount} product{productCount > 1 ? "s" : ""}
                                                </span>
                                            )}
                                        </div>

                                        <h2 className="mt-3 text-2xl font-bold text-slate-950">
                                            {category.title || "No Title"}
                                        </h2>

                                        {isEmpty ? (
                                            <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-red-700">
                                                Warning: this category has no products. Assign products to it
                                                in Strapi.
                                            </p>
                                        ) : (
                                            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-500">
                                                Products in this section are assigned to the category, which
                                                is the correct product placement.
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        <MediaCard
                                            title="Web Banner"
                                            media={category.banner?.webBanner}
                                            alt={`${category.title || "Category"} web banner`}
                                            sizeClass="w-16"
                                            zoomClass="hover:scale-[7]"
                                        />

                                        <MediaCard
                                            title="Mobile Banner"
                                            media={category.banner?.mobileBanner}
                                            alt={`${category.title || "Category"} mobile banner`}
                                            sizeClass="w-14"
                                            zoomClass="hover:scale-[7]"
                                        />

                                        <MediaCard
                                            title="Button Color"
                                            media={category.image}
                                            alt={`${category.title || "Category"} button color`}
                                            sizeClass="w-11"
                                        />

                                        <MediaCard
                                            title="Button Black"
                                            media={category.bImage}
                                            alt={`${category.title || "Category"} button black`}
                                            sizeClass="w-11"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Category Products */}
                            <div className="p-5 md:p-6">
                                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                                    <ProductReportTable
                                        Type="child"
                                        products={category.products?.data}
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
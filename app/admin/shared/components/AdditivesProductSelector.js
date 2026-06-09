"use client";

import { useEffect, useMemo, useState } from "react";

const CATEGORY_TABS = [
    {
        title: "Gasoline/PCMO",
        short: "PCMO",
        icon: "⛽",
        slug: "pcmo-gasoline",
        flow: ["api", "saeGrade"],
        refine: ["acea", "ilsac", "oem"],
        requiredForProducts: ["api", "saeGrade"],
    },
    {
        title: "Heavy Duty/HDDEO",
        short: "HDDEO",
        icon: "🚛",
        slug: "heavy-duty-hddeo",
        flow: ["api", "saeGrade"],
        refine: ["acea", "oem"],
        requiredForProducts: ["api", "saeGrade"],
    },
    {
        title: "Motorcycle",
        short: "Moto",
        icon: "🏍️",
        slug: "motorcycle-oil-additive",
        flow: ["api", "saeGrade"],
        refine: ["jaso"],
        requiredForProducts: ["api", "saeGrade"],
    },
    {
        title: "Driveline",
        short: "Drive",
        icon: "⚙️",
        slug: "driveline-additives",
        flow: ["type", "api"],
        refine: ["oem"],
        requiredForProducts: ["type", "api"],
    },
    {
        title: "Viscosity",
        short: "VI",
        icon: "🧪",
        slug: "viscosity-index-improvers",
        flow: ["type"],
        refine: ["ssi"],
        requiredForProducts: ["type", "ssi"],
    },
    {
        title: "Industrial",
        short: "Indus",
        icon: "🏭",
        slug: "industrial-additives",
        flow: ["type"],
        refine: ["oem"],
        requiredForProducts: ["type"],
    },
    {
        title: "Marine",
        short: "Marine",
        icon: "⚓",
        slug: "marine-additives",
        flow: ["type"],
        refine: ["oem"],
        requiredForProducts: ["type"],
    },
    {
        title: "Lubricant Components",
        short: "Lube",
        icon: "🛢️",
        slug: "lubricant-components",
        flow: ["type"],
        refine: [],
        requiredForProducts: ["type"],
    },
    {
        title: "Grease",
        short: "Grease",
        icon: "🧈",
        slug: "grease-additives",
        flow: ["type"],
        refine: [],
        requiredForProducts: ["type"],
    },
    {
        title: "Synthetic",
        short: "Synth",
        icon: "⚗️",
        slug: "synthetic-oils",
        flow: ["type"],
        refine: [],
        requiredForProducts: ["type"],
    },
    {
        title: "Speciality",
        short: "Spec",
        icon: "✨",
        slug: "speciality-chemicals",
        flow: ["type"],
        refine: [],
        requiredForProducts: ["type"],
    },
];

const FIELD_LABELS = {
    api: "API",
    saeGrade: "SAE Grade",
    type: "Type",
    acea: "ACEA",
    ilsac: "ILSAC",
    oem: "OEM",
    jaso: "JASO",
    ssi: "SSI",
};

const API_ROUTE = "/api/admin/shared/query";

function defaultFiltersForCategory(category) {
    const next = {};

    [...category.flow, ...category.refine].forEach((field) => {
        next[field] = "";
    });

    return next;
}

function buildQuery(params = {}) {
    const sp = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            sp.set(key, value);
        }
    });

    return sp.toString();
}

function getNextDisabled(field, filters) {
    if (field === "api") {
        if (filters.type !== undefined && !filters.type) return true;
        return false;
    }

    if (field === "saeGrade") {
        return !filters.api;
    }

    if (field === "type") {
        return false;
    }

    if (["acea", "ilsac", "oem", "jaso"].includes(field)) {
        if (filters.api !== undefined && !filters.api) return true;
        if (filters.saeGrade !== undefined && !filters.saeGrade) return true;
        if (filters.type !== undefined && filters.api !== undefined && !filters.api) return true;
    }

    if (field === "ssi") {
        if (filters.type !== undefined && !filters.type) return true;
    }

    return false;
}

function filterParams(category, filters, untilField = null) {
    const params = {
        categorySlug: category.slug,
    };

    const order = [...category.flow, ...category.refine];

    for (const field of order) {
        if (field === untilField) break;

        if (filters[field]) {
            params[field] = filters[field];
        }
    }

    return params;
}

function selectedFilterParams(category, filters) {
    const params = {};

    [...category.flow, ...category.refine].forEach((field) => {
        if (filters[field]) {
            params[field] = filters[field];
        }
    });

    return params;
}

function hasMinimumFilters(category, filters) {
    const required = category.requiredForProducts || [];

    return required.every((field) => Boolean(filters[field]));
}

function getMinimumText(category) {
    const required = category.requiredForProducts || [];

    if (!required.length) return "";

    return required.map((field) => FIELD_LABELS[field]).join(" + ");
}

export default function AdditivesProductSelector({
    initialSlug = "pcmo-gasoline",
    title = "Product Selector",
    showTitle = true,
}) {
    const initialCategory =
        CATEGORY_TABS.find((item) => item.slug === initialSlug) || CATEGORY_TABS[0];

    const [category, setCategory] = useState(initialCategory);
    const [filters, setFilters] = useState(defaultFiltersForCategory(initialCategory));

    const [options, setOptions] = useState({});
    const [products, setProducts] = useState([]);

    const [loadingOptions, setLoadingOptions] = useState(false);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [error, setError] = useState("");

    const activeFields = useMemo(() => {
        return [...category.flow, ...category.refine];
    }, [category]);

    const canShowProducts = useMemo(() => {
        return hasMinimumFilters(category, filters);
    }, [category, filters]);

    async function fetchJson(url) {
        const res = await fetch(url, {
            cache: "no-store",
        });

        const text = await res.text();

        let data = null;

        try {
            data = JSON.parse(text);
        } catch (err) {
            console.log("[selector] Invalid JSON:", text);
            throw new Error("Invalid JSON from selector API");
        }

        if (!res.ok || data?.ok === false) {
            throw new Error(data?.error || "Request failed");
        }

        return data;
    }

    async function loadOptions(nextCategory = category, nextFilters = filters) {
        try {
            setLoadingOptions(true);
            setError("");

            const optionResults = {};

            for (const field of [...nextCategory.flow, ...nextCategory.refine]) {
                const disabled = getNextDisabled(field, nextFilters);

                if (disabled) {
                    optionResults[field] = [];
                    continue;
                }

                const query = buildQuery({
                    mode: "options",
                    field,
                    ...filterParams(nextCategory, nextFilters, field),
                });

                const data = await fetchJson(`${API_ROUTE}?${query}`);
                optionResults[field] = data?.items || [];
            }

            setOptions(optionResults);
        } catch (err) {
            console.log("[selector] loadOptions error:", err);
            setError(err?.message || "Failed to load dropdowns");
        } finally {
            setLoadingOptions(false);
        }
    }

    async function loadProducts(nextCategory = category, nextFilters = filters) {
        try {
            setError("");

            const allowed = hasMinimumFilters(nextCategory, nextFilters);

            if (!allowed) {
                setProducts([]);
                return;
            }

            setLoadingProducts(true);

            const query = buildQuery({
                mode: "products",
                categorySlug: nextCategory.slug,
                ...selectedFilterParams(nextCategory, nextFilters),
            });

            const data = await fetchJson(`${API_ROUTE}?${query}`);
            setProducts(data?.items || []);
        } catch (err) {
            console.log("[selector] loadProducts error:", err);
            setError(err?.message || "Failed to load products");
        } finally {
            setLoadingProducts(false);
        }
    }

    useEffect(() => {
        loadOptions(category, filters);
        loadProducts(category, filters);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function handleCategoryChange(nextCategory) {
        const nextFilters = defaultFiltersForCategory(nextCategory);

        setCategory(nextCategory);
        setFilters(nextFilters);
        setOptions({});
        setProducts([]);

        await Promise.all([
            loadOptions(nextCategory, nextFilters),
            loadProducts(nextCategory, nextFilters),
        ]);
    }

    async function handleFilterChange(field, value) {
        const nextFilters = {
            ...filters,
            [field]: value,
        };

        const order = activeFields;
        const currentIndex = order.indexOf(field);

        order.forEach((item, index) => {
            if (index > currentIndex) {
                nextFilters[item] = "";
            }
        });

        setFilters(nextFilters);

        await Promise.all([
            loadOptions(category, nextFilters),
            loadProducts(category, nextFilters),
        ]);
    }

    function clearFilters() {
        const nextFilters = defaultFiltersForCategory(category);

        setFilters(nextFilters);
        setProducts([]);
        loadOptions(category, nextFilters);
        loadProducts(category, nextFilters);
    }

    return (
        <section className="w-full rounded-2xl border border-blue-100 bg-white shadow-sm">
            {showTitle && (
                <div className="border-b border-blue-100 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 px-4 py-4 text-white">
                    <h2 className="text-xl font-bold">{title}</h2>
                    <p className="mt-1 text-sm text-blue-50">
                        Select category, choose filters, and view matching products.
                    </p>
                </div>
            )}

            <div className="p-3 md:p-4">
                <div className="mb-4 overflow-x-auto">
                    <div className="flex min-w-max gap-2">
                        {CATEGORY_TABS.map((item) => {
                            const active = item.slug === category.slug;

                            return (
                                <button
                                    key={item.slug}
                                    type="button"
                                    onClick={() => handleCategoryChange(item)}
                                    className={`flex min-w-[96px] flex-col items-center justify-center rounded-xl border px-3 py-2 text-center transition ${active
                                        ? "border-blue-600 bg-blue-600 text-white shadow-md"
                                        : "border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50"
                                        }`}
                                >
                                    <span className="text-xl leading-none">{item.icon}</span>
                                    <span className="mt-1 text-xs font-bold">{item.short}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-3">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">
                                {category.title}
                            </h3>

                            <p className="text-sm text-gray-500">
                                {category.flow.map((f) => FIELD_LABELS[f]).join(" → ")}
                                {category.refine.length
                                    ? ` → ${category.refine
                                        .map((f) => FIELD_LABELS[f])
                                        .join(" / ")}`
                                    : ""}
                            </p>

                            <p className="mt-1 text-xs font-semibold text-blue-700">
                                Product cards show after selecting: {getMinimumText(category)}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={clearFilters}
                            className="h-9 rounded-lg border border-blue-200 bg-white px-4 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>

                {error ? (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                        {error}
                    </div>
                ) : null}

                <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {activeFields.map((field) => {
                        const disabled = getNextDisabled(field, filters);
                        const list = options[field] || [];

                        return (
                            <div
                                key={field}
                                className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm"
                            >
                                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
                                    {FIELD_LABELS[field]}
                                </label>

                                <div className="relative">
                                    <select
                                        value={filters[field] || ""}
                                        disabled={disabled || loadingOptions}
                                        onChange={(e) =>
                                            handleFilterChange(field, e.target.value)
                                        }
                                        className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 pr-12 text-sm font-semibold text-gray-900 outline-none hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                                    >
                                        <option value="">
                                            {disabled
                                                ? "Select previous first"
                                                : `All ${FIELD_LABELS[field]}`}
                                        </option>

                                        {list.map((item) => (
                                            <option
                                                key={item.documentId || item.id || item.value}
                                                value={item.documentId || item.id || item.value}
                                            >
                                                {item.label}
                                            </option>
                                        ))}
                                    </select>

                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500">
                                        <svg
                                            className="h-5 w-5"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                            aria-hidden="true"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </div>
                                </div>

                                {!disabled && !loadingOptions && list.length === 0 ? (
                                    <div className="mt-2 rounded-md border border-orange-200 bg-orange-50 px-2 py-1.5 text-xs font-semibold text-orange-700">
                                        No {FIELD_LABELS[field]} found.
                                    </div>
                                ) : null}
                            </div>
                        );
                    })}
                </div>

                <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-lg font-bold text-gray-900">
                        Products
                    </h3>

                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                        {!canShowProducts
                            ? "Waiting for filters"
                            : loadingProducts
                                ? "Loading..."
                                : `${products.length} found`}
                    </span>
                </div>

                {!canShowProducts ? (
                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 text-center">
                        <div className="text-sm font-bold text-blue-800">
                            Select minimum filters to show products.
                        </div>

                        <p className="mt-1 text-xs font-medium text-blue-700">
                            Required: {getMinimumText(category)}
                        </p>
                    </div>
                ) : loadingProducts ? (
                    <ProductSkeleton />
                ) : products.length ? (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {products.map((product) => (
                            <ProductCard
                                key={product.documentId || product.id}
                                product={product}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="rounded-xl border border-orange-200 bg-orange-50 p-5 text-center">
                        <div className="text-sm font-bold text-orange-700">
                            No products found.
                        </div>

                        <p className="mt-1 text-xs text-orange-600">
                            Try changing category or filters.
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}

function ProductSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
                <div
                    key={index}
                    className="h-40 animate-pulse rounded-xl border border-gray-200 bg-gray-100"
                />
            ))}
        </div>
    );
}

function ProductCard({ product }) {
    const chips = [
        ...chipGroup("API", product.api),
        ...chipGroup("SAE", product.saeGrade),
        ...chipGroup("Type", product.type),
        ...chipGroup("ACEA", product.aceas),
        ...chipGroup("ILSAC", product.ilsacs),
        ...chipGroup("OEM", product.oems),
        ...chipGroup("JASO", product.jasos),
        ...chipGroup("SSI", product.ssis),
    ];

    return (
        <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md">
            <div className="flex gap-3">
                {product.image ? (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={product.image}
                            alt={product.title || "Product Image"}
                            className="h-full w-full rounded-xl object-contain"
                        />
                    </div>
                ) : null}

                <div className="min-w-0 flex-1">
                    <h4 className="line-clamp-2 text-sm font-bold text-gray-900">
                        {product.title || "Untitled Product"}
                    </h4>

                    {product.dosage ? (
                        <p className="mt-1 truncate text-xs font-semibold text-gray-700">
                            Dosage: {product.dosage}
                        </p>
                    ) : null}
                </div>
            </div>

            {chips.length ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                    {chips.slice(0, 12).map((chip, index) => (
                        <span
                            key={`${chip}-${index}`}
                            className="rounded-full border border-blue-100 bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700"
                        >
                            {chip}
                        </span>
                    ))}
                </div>
            ) : (
                <div className="mt-3 rounded-lg bg-gray-50 px-2 py-2 text-xs text-gray-500">
                    No relation data available yet.
                </div>
            )}
        </article>
    );
}

function chipGroup(label, value) {
    if (!value) return [];

    if (Array.isArray(value)) {
        return value
            .filter(Boolean)
            .map((item) => `${label}: ${item}`);
    }

    return [`${label}: ${value}`];
}
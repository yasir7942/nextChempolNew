"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Combobox,
    ComboboxButton,
    ComboboxInput,
    ComboboxOption,
    ComboboxOptions,
} from "@headlessui/react";
import ENUMS from "../config/enums.json";

const STATIC_CATEGORY = {
    title: "Synthetic Oils",
    slug: "synthetic-oils",
};

const API_ROUTE = "/api/admin/synthetic";

const ADD_LABELS = {
    product: "Product",
};

const SECTION_META = {
    type: {
        title: "Type",
        emptyText: "Select Type",
        disabledText: "Select Type",
    },
    product: {
        title: "Product",
        addText: "Add Product",
        emptyText: "Select Product",
        disabledText: "Select Type first",
    },
};

function enumToOptions(values = []) {
    return values.map((value) => ({
        id: value,
        documentId: value,
        value,
        label: value,
    }));
}

function toDropdownOptions(items = []) {
    if (!Array.isArray(items)) return [];

    return items
        .filter((item) => item && (item.label || item.value || item.id || item.documentId))
        .map((item) => {
            const value = item.value || item.documentId || item.id || item.label;
            const label = item.label || value;

            return {
                value: String(value),
                label: String(label),
            };
        });
}

export default function SyntheticOilsPage() {
    const [loading, setLoading] = useState(true);
    const [savingType, setSavingType] = useState("");

    const [allProducts, setAllProducts] = useState([]);

    const [staticCategory, setStaticCategory] = useState({
        label: STATIC_CATEGORY.title,
        slug: STATIC_CATEGORY.slug,
    });

    const [types, setTypes] = useState([]);
    const [products, setProducts] = useState([]);

    const [selectedType, setSelectedType] = useState("");
    const [selectedProduct, setSelectedProduct] = useState("");

    const [selectedProductFromList, setSelectedProductFromList] = useState("");

    const [addMode, setAddMode] = useState({
        product: false,
    });

    const [message, setMessage] = useState({
        type: "",
        text: "",
    });

    const selectedTypeObj = useMemo(() => {
        return (
            types.find(
                (item) => String(item.documentId || item.id) === String(selectedType)
            ) || null
        );
    }, [types, selectedType]);

    const selectedProductObj = useMemo(() => {
        return (
            products.find(
                (item) => String(item.documentId || item.id) === String(selectedProduct)
            ) || null
        );
    }, [products, selectedProduct]);

    function resetMessage() {
        setMessage({ type: "", text: "" });
    }

    function showError(error) {
        console.log("[synthetic page] error:", error);

        setMessage({
            type: "error",
            text: error?.message || "Something went wrong",
        });
    }

    function showSuccess(text) {
        setMessage({
            type: "success",
            text,
        });
    }

    async function fetchJson(url, options = {}) {
        const response = await fetch(url, {
            cache: "no-store",
            ...options,
        });

        const text = await response.text();

        let data = null;

        try {
            data = JSON.parse(text);
        } catch (error) {
            console.log("[synthetic page] JSON parse error:", error);
            console.log("[synthetic page] response text:", text);
            throw new Error("Invalid JSON from API route");
        }

        if (!response.ok) {
            throw new Error(data?.error || "Request failed");
        }

        return data;
    }

    async function loadStaticCategory() {
        const data = await fetchJson(`${API_ROUTE}?mode=static-category`);

        setStaticCategory(
            data?.item || {
                label: STATIC_CATEGORY.title,
                slug: STATIC_CATEGORY.slug,
            }
        );
    }

    async function loadTypes() {
        setTypes(enumToOptions(ENUMS.SyntheticType || []));
    }

    async function loadAllProducts(typeId) {
        if (!typeId) {
            setAllProducts([]);
            return;
        }

        const data = await fetchJson(
            `${API_ROUTE}?mode=all-products&typeId=${encodeURIComponent(typeId)}`
        );

        setAllProducts(data?.items || []);
    }

    async function loadProducts(typeId) {
        if (!typeId) {
            setProducts([]);
            return;
        }

        const data = await fetchJson(
            `${API_ROUTE}?mode=products&typeId=${encodeURIComponent(typeId)}`
        );

        setProducts(data?.items || []);
    }

    useEffect(() => {
        async function init() {
            try {
                setLoading(true);
                resetMessage();

                await Promise.all([
                    loadStaticCategory(),
                    loadTypes(),
                ]);
            } catch (error) {
                showError(error);
            } finally {
                setLoading(false);
            }
        }

        init();
    }, []);

    useEffect(() => {
        async function run() {
            try {
                resetMessage();

                setSelectedProduct("");
                setSelectedProductFromList("");

                setProducts([]);
                setAllProducts([]);

                if (selectedType) {
                    await Promise.all([
                        loadProducts(selectedType),
                        loadAllProducts(selectedType),
                    ]);
                }
            } catch (error) {
                showError(error);
            }
        }

        run();
    }, [selectedType]);

    function toggleAdd(type) {
        setAddMode((prev) => ({
            ...prev,
            [type]: !prev[type],
        }));
    }

    function getSelectedAddValue(type) {
        if (type === "product") return selectedProductFromList;
        return "";
    }

    function setSelectedAddValue(type, value) {
        if (type === "product") setSelectedProductFromList(value);
    }

    async function handleAdd(type) {
        try {
            resetMessage();

            const selectedValue = getSelectedAddValue(type);

            if (type === "product") {
                if (!selectedType) throw new Error("Please select Type first");
                if (!selectedValue) throw new Error("Please select Product from list");
            }

            setSavingType(type);

            const payload = {
                type,
                title: selectedValue,
                typeId: selectedType || null,
                productId: type === "product" ? selectedValue : null,
            };

            const data = await fetchJson(API_ROUTE, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            setAddMode((prev) => ({
                ...prev,
                [type]: false,
            }));

            if (type === "product") {
                setSelectedProductFromList("");

                await Promise.all([
                    loadProducts(selectedType),
                    loadAllProducts(selectedType),
                ]);

                if (data?.item?.documentId) {
                    setSelectedProduct(String(data.item.documentId));
                }

                showSuccess("Product added successfully");
            }
        } catch (error) {
            showError(error);
        } finally {
            setSavingType("");
        }
    }

    function renderMessage() {
        if (!message.text) return null;

        return (
            <div
                className={`mb-3 rounded-lg border px-3 py-2 text-sm font-medium ${message.type === "error"
                        ? "border-red-200 bg-red-50 text-red-700"
                        : "border-green-200 bg-green-50 text-green-700"
                    }`}
            >
                {message.text}
            </div>
        );
    }

    function MainSelect({
        value,
        onChange,
        options,
        placeholder,
        disabled = false,
    }) {
        return (
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
            >
                <option value="">{placeholder}</option>

                {options.map((item) => {
                    const itemValue = item.documentId || item.id;

                    return (
                        <option key={itemValue} value={itemValue}>
                            {item.label}
                        </option>
                    );
                })}
            </select>
        );
    }

    function SearchableAddDropdown({
        type,
        options,
        value,
        disabled = false,
    }) {
        const [query, setQuery] = useState("");

        const dropdownList = toDropdownOptions(options);

        const filteredList =
            query.trim() === ""
                ? dropdownList
                : dropdownList.filter((item) =>
                    item.label.toLowerCase().includes(query.trim().toLowerCase())
                );

        const selectedItem =
            dropdownList.find((item) => String(item.value) === String(value)) || null;

        if (disabled) {
            return (
                <div className="flex h-9 w-full items-center rounded-lg border border-gray-200 bg-gray-100 px-3 text-sm text-gray-500">
                    Select parent value first
                </div>
            );
        }

        if (!dropdownList.length) {
            return (
                <div className="flex h-9 w-full items-center rounded-lg border border-orange-200 bg-orange-50 px-3 text-sm font-medium text-orange-700">
                    No values available
                </div>
            );
        }

        return (
            <Combobox
                value={selectedItem}
                onChange={(item) => {
                    setSelectedAddValue(type, item?.value || "");
                    setQuery("");
                }}
                disabled={disabled}
            >
                <div className="relative w-full">
                    <div className="relative w-full">
                        <ComboboxInput
                            className="h-9 w-full cursor-pointer rounded-lg border border-gray-300 bg-white px-3 pr-9 text-sm text-gray-900 outline-none placeholder:text-gray-400 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            displayValue={(item) => item?.label || ""}
                            onChange={(event) => setQuery(event.target.value)}
                            onFocus={() => setQuery("")}
                            placeholder={`Search / select ${ADD_LABELS[type]}`}
                        />

                        <ComboboxButton className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                            <svg
                                className="h-4 w-4"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </ComboboxButton>
                    </div>

                    <ComboboxOptions className="absolute z-50 mt-1 max-h-64 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
                        <div className="border-b border-gray-100 bg-gray-50 px-3 py-2 text-[11px] font-medium text-gray-500">
                            Type in the field above to search
                        </div>

                        <div className="max-h-56 overflow-y-auto p-1">
                            {filteredList.length === 0 ? (
                                <div className="px-3 py-2 text-sm text-gray-500">
                                    No matching values found
                                </div>
                            ) : (
                                filteredList.map((item) => (
                                    <ComboboxOption
                                        key={item.value}
                                        value={item}
                                        className={({ active, selected }) =>
                                            `cursor-pointer rounded-md px-3 py-2 text-sm ${active
                                                ? "bg-blue-50 text-blue-700"
                                                : "text-gray-700"
                                            } ${selected
                                                ? "bg-blue-50 font-semibold text-blue-700"
                                                : "font-normal"
                                            }`
                                        }
                                    >
                                        {item.label}
                                    </ComboboxOption>
                                ))
                            )}
                        </div>
                    </ComboboxOptions>
                </div>
            </Combobox>
        );
    }

    function AddDropdownPanel({ type, options, disabled = false }) {
        const selectedValue = getSelectedAddValue(type);
        const dropdownList = toDropdownOptions(options);

        return (
            <div className="mt-2 rounded-lg border border-blue-100 bg-blue-50/60 p-2">
                <div className="mb-2 flex items-center justify-between gap-2">
                    <div>
                        <h4 className="text-xs font-bold text-gray-900">
                            Add {ADD_LABELS[type]}
                        </h4>
                        <p className="text-[11px] leading-4 text-gray-500">
                            Product list is filtered by published status and Synthetic Oils category.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto]">
                    <SearchableAddDropdown
                        type={type}
                        options={options}
                        value={selectedValue}
                        disabled={disabled}
                    />

                    <button
                        type="button"
                        onClick={() => handleAdd(type)}
                        disabled={
                            disabled ||
                            savingType === type ||
                            !selectedValue ||
                            !dropdownList.length
                        }
                        className="h-9 rounded-lg bg-green-600 px-5 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {savingType === type ? "Saving..." : "Save"}
                    </button>
                </div>

                {!disabled && !dropdownList.length && (
                    <div className="mt-2 rounded-md border border-orange-200 bg-orange-50 px-2 py-1.5 text-xs font-medium text-orange-700">
                        All values are already added.
                    </div>
                )}
            </div>
        );
    }

    function renderTypeSection() {
        const meta = SECTION_META.type;

        return (
            <section className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                <div className="mb-2 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-bold text-gray-900">
                        {meta.title}
                    </h3>
                </div>

                <MainSelect
                    value={selectedType}
                    onChange={setSelectedType}
                    options={types}
                    placeholder={meta.emptyText}
                />
            </section>
        );
    }

    function renderProductSection() {
        const meta = SECTION_META.product;

        return (
            <section className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                <div className="mb-2 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-bold text-gray-900">
                        {meta.title}
                    </h3>

                    <button
                        type="button"
                        onClick={() => toggleAdd("product")}
                        disabled={!selectedType}
                        className={`h-8 rounded-lg px-3 text-xs font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${addMode.product
                                ? "bg-red-500 hover:bg-red-600"
                                : "bg-blue-600 hover:bg-blue-700"
                            }`}
                    >
                        {addMode.product ? "Cancel" : meta.addText}
                    </button>
                </div>

                <MainSelect
                    value={selectedProduct}
                    onChange={setSelectedProduct}
                    options={products}
                    disabled={!selectedType}
                    placeholder={!selectedType ? meta.disabledText : meta.emptyText}
                />

                {addMode.product && (
                    <AddDropdownPanel
                        type="product"
                        options={allProducts}
                        disabled={!selectedType}
                    />
                )}
            </section>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-3 md:p-4">
            <div className="mx-auto max-w-6xl">
                <div className="mb-3 overflow-hidden rounded-xl border border-blue-100 bg-white shadow-sm">
                    <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 px-4 py-4 text-white">
                        <h1 className="mt-1 text-2xl font-bold">
                            Synthetic Oils
                        </h1>

                        <p className="mt-1 text-sm text-blue-50">
                            Type → Product
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-2 p-3 md:grid-cols-3">
                        <InfoBox
                            label="Product Category"
                            value={staticCategory?.label || STATIC_CATEGORY.title}
                        />

                        <InfoBox
                            label="Slug"
                            value={staticCategory?.slug || STATIC_CATEGORY.slug}
                        />

                        <InfoBox
                            label="Flow"
                            value="Type → Product"
                        />
                    </div>
                </div>

                {renderMessage()}

                {loading ? (
                    <div className="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-sm">
                        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
                        <div className="text-sm font-semibold text-gray-700">
                            Loading selector data...
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_320px]">
                        <div className="space-y-3">
                            {renderTypeSection()}
                            {renderProductSection()}
                        </div>

                        <aside className="h-fit rounded-xl border border-gray-200 bg-white p-3 shadow-sm lg:sticky lg:top-4">
                            <h2 className="text-base font-bold text-gray-900">
                                Selected Data
                            </h2>

                            <div className="mt-3 space-y-2">
                                <SummaryRow
                                    label="Product Category"
                                    value={staticCategory?.label || STATIC_CATEGORY.title}
                                />

                                <SummaryRow
                                    label="Type"
                                    value={selectedTypeObj?.label}
                                />

                                <SummaryRow
                                    label="Product"
                                    value={selectedProductObj?.label}
                                />
                            </div>

                            <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                                Type dropdown loads from enums.json variable SyntheticType.
                            </div>
                        </aside>

                        <div className="p-32 w-full"></div>
                    </div>
                )}
            </div>
        </div>
    );
}

function InfoBox({ label, value }) {
    return (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                {label}
            </div>

            <div className="mt-0.5 truncate text-sm font-bold text-gray-900">
                {value || "—"}
            </div>
        </div>
    );
}

function SummaryRow({ label, value }) {
    return (
        <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                {label}
            </div>

            <div className="mt-0.5 text-sm font-bold text-gray-900">
                {value || "—"}
            </div>
        </div>
    );
}
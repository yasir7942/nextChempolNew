"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Combobox,
    ComboboxButton,
    ComboboxInput,
    ComboboxOption,
    ComboboxOptions,
} from "@headlessui/react";

const STATIC_CATEGORY = {
    title: "Motorcycle Oil Additive",
    slug: "motorcycle-oil-additive",
};

const API_ROUTE = "/api/admin/motorcycle";

const ADD_LABELS = {
    api: "API",
    saeGrade: "SAE Grade",
    product: "Product",
    jaso: "JASO",
};

const SECTION_META = {
    api: {
        title: "API",
        addText: "Add API",
        emptyText: "Select API",
        disabledText: "Select API",
    },
    saeGrade: {
        title: "SAE Grade",
        addText: "Add SAE Grade",
        emptyText: "Select SAE Grade",
        disabledText: "Select API first",
    },
    product: {
        title: "Product",
        addText: "Add Product",
        emptyText: "Select Product",
        disabledText: "Select SAE Grade first",
    },
    jaso: {
        title: "JASO",
        addText: "Add JASO",
        emptyText: "Select JASO",
        disabledText: "Select Product first",
    },
};

function toDropdownOptions(items = []) {
    return (Array.isArray(items) ? items : [])
        .filter((item) => item && (item.label || item.value || item.id || item.documentId))
        .map((item) => {
            const value = item.value || item.documentId || item.id || item.label;
            const label = item.label || value;

            return {
                ...item,
                value: String(value),
                label: String(label),
            };
        });
}

function getItemValue(item) {
    return String(item?.documentId || item?.id || item?.value || "");
}

function findSelected(options, value) {
    return (options || []).find((item) => getItemValue(item) === String(value || "")) || null;
}

export default function MotorcyclePage() {
    const [loading, setLoading] = useState(true);
    const [savingType, setSavingType] = useState("");
    const [deletingType, setDeletingType] = useState("");

    const [staticCategory, setStaticCategory] = useState({
        label: STATIC_CATEGORY.title,
        slug: STATIC_CATEGORY.slug,
    });

    const [apis, setApis] = useState([]);
    const [saeGrades, setSaeGrades] = useState([]);
    const [products, setProducts] = useState([]);
    const [jasos, setJasos] = useState([]);

    const [allApis, setAllApis] = useState([]);
    const [allSaeGrades, setAllSaeGrades] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [allJasos, setAllJasos] = useState([]);

    const [selectedApi, setSelectedApi] = useState("");
    const [selectedSaeGrade, setSelectedSaeGrade] = useState("");
    const [selectedProduct, setSelectedProduct] = useState("");
    const [selectedJaso, setSelectedJaso] = useState("");

    const [selectedAdd, setSelectedAdd] = useState({
        api: "",
        saeGrade: "",
        product: "",
        jaso: "",
    });

    const [addMode, setAddMode] = useState({
        api: false,
        saeGrade: false,
        product: false,
        jaso: false,
    });

    const [message, setMessage] = useState({
        type: "",
        text: "",
    });

    const selectedApiObj = useMemo(
        () => findSelected(apis, selectedApi),
        [apis, selectedApi]
    );

    const selectedSaeObj = useMemo(
        () => findSelected(saeGrades, selectedSaeGrade),
        [saeGrades, selectedSaeGrade]
    );

    const selectedProductObj = useMemo(
        () => findSelected(products, selectedProduct),
        [products, selectedProduct]
    );

    const selectedJasoObj = useMemo(
        () => findSelected(jasos, selectedJaso),
        [jasos, selectedJaso]
    );

    function showSuccess(text) {
        setMessage({
            type: "success",
            text,
        });
    }

    function showError(error) {
        console.log("[motorcycle page] error:", error);

        setMessage({
            type: "error",
            text: error?.message || "Something went wrong",
        });
    }

    function resetMessage() {
        setMessage({
            type: "",
            text: "",
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
            console.log("[motorcycle page] JSON parse error:", error);
            console.log("[motorcycle page] response text:", text);
            throw new Error("Invalid JSON from API route");
        }

        if (!response.ok || data?.ok === false) {
            throw new Error(data?.error || "Request failed");
        }

        return data;
    }

    function apiUrl(mode, params = {}) {
        const sp = new URLSearchParams({
            mode,
        });

        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
                sp.set(key, value);
            }
        });

        return `${API_ROUTE}?${sp.toString()}`;
    }

    async function loadStaticCategory() {
        const data = await fetchJson(apiUrl("static-category"));

        setStaticCategory(
            data?.item || {
                label: STATIC_CATEGORY.title,
                slug: STATIC_CATEGORY.slug,
            }
        );
    }

    async function loadApis() {
        const [data, all] = await Promise.all([
            fetchJson(apiUrl("apis")),
            fetchJson(apiUrl("allapis")),
        ]);

        setApis(data?.items || []);
        setAllApis(all?.items || []);
    }

    async function loadSaeGrades(apiId) {
        if (!apiId) {
            setSaeGrades([]);
            setAllSaeGrades([]);
            return;
        }

        const [data, all] = await Promise.all([
            fetchJson(apiUrl("sae-grades", { apiId })),
            fetchJson(apiUrl("all-sae-grades", { apiId })),
        ]);

        setSaeGrades(data?.items || []);
        setAllSaeGrades(all?.items || []);
    }

    async function loadProducts(saeGradeId) {
        if (!saeGradeId) {
            setProducts([]);
            setAllProducts([]);
            return;
        }

        const [data, all] = await Promise.all([
            fetchJson(apiUrl("products", { saeGradeId })),
            fetchJson(
                apiUrl("all-products", {
                    apiId: selectedApi,
                    saeGradeId,
                })
            ),
        ]);

        setProducts(data?.items || []);
        setAllProducts(all?.items || []);
    }

    async function loadJasos(saeGradeId, productId) {
        if (!saeGradeId || !productId) {
            setJasos([]);
            setAllJasos([]);
            return;
        }

        const [data, all] = await Promise.all([
            fetchJson(apiUrl("jasos", { saeGradeId, productId })),
            fetchJson(apiUrl("all-jasos", { saeGradeId, productId })),
        ]);

        setJasos(data?.items || []);
        setAllJasos(all?.items || []);
    }

    useEffect(() => {
        async function init() {
            try {
                setLoading(true);
                resetMessage();

                await Promise.all([loadStaticCategory(), loadApis()]);
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

                setSelectedSaeGrade("");
                setSelectedProduct("");
                setSelectedJaso("");

                setSaeGrades([]);
                setAllSaeGrades([]);
                setProducts([]);
                setAllProducts([]);
                setJasos([]);
                setAllJasos([]);

                if (selectedApi) {
                    await loadSaeGrades(selectedApi);
                }
            } catch (error) {
                showError(error);
            }
        }

        run();
    }, [selectedApi]);

    useEffect(() => {
        async function run() {
            try {
                resetMessage();

                setSelectedProduct("");
                setSelectedJaso("");

                setProducts([]);
                setAllProducts([]);
                setJasos([]);
                setAllJasos([]);

                if (selectedSaeGrade) {
                    await loadProducts(selectedSaeGrade);
                }
            } catch (error) {
                showError(error);
            }
        }

        run();
    }, [selectedSaeGrade]);

    useEffect(() => {
        async function run() {
            try {
                resetMessage();

                setSelectedJaso("");

                setJasos([]);
                setAllJasos([]);

                if (selectedSaeGrade && selectedProduct) {
                    await loadJasos(selectedSaeGrade, selectedProduct);
                }
            } catch (error) {
                showError(error);
            }
        }

        run();
    }, [selectedProduct]);

    function setSelectedAddValue(type, value) {
        setSelectedAdd((prev) => ({
            ...prev,
            [type]: value,
        }));
    }

    function toggleAdd(type) {
        setAddMode((prev) => ({
            ...prev,
            [type]: !prev[type],
        }));
    }

    async function handleAdd(type) {
        try {
            resetMessage();

            const selectedValue = selectedAdd[type];

            if (!selectedValue) {
                throw new Error(`Please select ${ADD_LABELS[type]} from list`);
            }

            if (type === "saeGrade" && !selectedApi) {
                throw new Error("Please select API first");
            }

            if (type === "product" && !selectedSaeGrade) {
                throw new Error("Please select SAE Grade first");
            }

            if (type === "jaso" && (!selectedSaeGrade || !selectedProduct)) {
                throw new Error("Please select Product first");
            }

            setSavingType(type);

            const payload = {
                type,
                title: selectedValue,
                apiId: selectedApi || null,
                saeGradeId: selectedSaeGrade || null,
                productId: type === "product" ? selectedValue : selectedProduct || null,
            };

            const data = await fetchJson(API_ROUTE, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            setSelectedAddValue(type, "");

            setAddMode((prev) => ({
                ...prev,
                [type]: false,
            }));

            if (type === "api") {
                await loadApis();

                if (data?.item?.documentId) {
                    setSelectedApi(String(data.item.documentId));
                }
            }

            if (type === "saeGrade") {
                await loadSaeGrades(selectedApi);

                if (data?.item?.documentId) {
                    setSelectedSaeGrade(String(data.item.documentId));
                }
            }

            if (type === "product") {
                await loadProducts(selectedSaeGrade);

                if (data?.item?.documentId) {
                    setSelectedProduct(String(data.item.documentId));
                } else if (selectedValue) {
                    setSelectedProduct(String(selectedValue));
                }
            }

            if (type === "jaso") {
                await loadJasos(selectedSaeGrade, selectedProduct);

                if (data?.item?.documentId) {
                    setSelectedJaso(String(data.item.documentId));
                }
            }

            showSuccess(`${ADD_LABELS[type]} added successfully`);
        } catch (error) {
            showError(error);
        } finally {
            setSavingType("");
        }
    }

    async function handleDelete(type, item) {
        try {
            resetMessage();

            const documentId = item?.documentId || item?.id || item?.value;
            const label = item?.label || documentId;

            if (!documentId) {
                throw new Error("Delete item documentId missing");
            }

            setDeletingType(type);

            const check = await fetchJson(
                apiUrl("delete-check", {
                    type,
                    documentId,
                    apiId: selectedApi,
                    saeGradeId: selectedSaeGrade,
                    productId: selectedProduct,
                })
            );

            if (check?.blocked) {
                window.alert(
                    check?.message ||
                    `This ${ADD_LABELS[type]} has relation data. First remove relation data, then delete it.`
                );
                return;
            }

            const confirmText =
                type === "product"
                    ? `Remove Product from selected SAE Grade?\n\nProduct will NOT be deleted from Product collection.\nOnly relation will be removed from selected SAE Grade.\n\nProduct: ${label}`
                    : `Delete ${ADD_LABELS[type]}: ${label}?`;

            if (!window.confirm(confirmText)) {
                return;
            }

            await fetchJson(API_ROUTE, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    type,
                    documentId,
                    apiId: selectedApi || null,
                    saeGradeId: selectedSaeGrade || null,
                    productId: selectedProduct || null,
                }),
            });

            if (type === "api") {
                if (String(selectedApi) === String(documentId)) {
                    setSelectedApi("");
                }

                await loadApis();
                showSuccess("API deleted successfully");
                return;
            }

            if (type === "saeGrade") {
                if (String(selectedSaeGrade) === String(documentId)) {
                    setSelectedSaeGrade("");
                }

                if (selectedApi) {
                    await loadSaeGrades(selectedApi);
                }

                showSuccess("SAE Grade deleted successfully");
                return;
            }

            if (type === "product") {
                if (String(selectedProduct) === String(documentId)) {
                    setSelectedProduct("");
                }

                setSelectedJaso("");

                if (selectedSaeGrade) {
                    await loadProducts(selectedSaeGrade);
                }

                showSuccess("Product removed from selected SAE Grade successfully");
                return;
            }

            if (type === "jaso") {
                if (String(selectedJaso) === String(documentId)) {
                    setSelectedJaso("");
                }

                await loadJasos(selectedSaeGrade, selectedProduct);

                showSuccess("JASO deleted successfully");
            }
        } catch (error) {
            showError(error);
        } finally {
            setDeletingType("");
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

    function DropdownArrow() {
        return (
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
        );
    }

    function MainDropdown({
        type,
        value,
        onChange,
        options,
        placeholder,
        disabled = false,
    }) {
        const [query, setQuery] = useState("");

        const dropdownList = toDropdownOptions(options);
        const selectedItem = findSelected(dropdownList, value);

        const filteredList =
            query.trim() === ""
                ? dropdownList
                : dropdownList.filter((item) => {
                    return item.label.toLowerCase().includes(query.trim().toLowerCase());
                });

        if (disabled) {
            return (
                <div className="flex h-10 w-full items-center rounded-lg border border-gray-200 bg-gray-100 px-3 text-sm text-gray-500">
                    {placeholder}
                </div>
            );
        }

        return (
            <Combobox
                value={selectedItem}
                onChange={(item) => {
                    onChange(item?.value || "");
                    setQuery("");
                }}
            >
                <div className="relative w-full">
                    <ComboboxInput
                        className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pr-12 text-sm font-medium text-gray-900 outline-none placeholder:text-gray-400 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        displayValue={(item) => item?.label || ""}
                        onChange={(event) => setQuery(event.target.value)}
                        onFocus={() => setQuery("")}
                        placeholder={placeholder}
                    />

                    <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-4 pl-3 text-gray-500">
                        <DropdownArrow />
                    </ComboboxButton>

                    <ComboboxOptions className="absolute z-50 mt-1 max-h-64 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
                        <div className="border-b border-gray-100 bg-gray-50 px-3 py-2 text-[11px] font-medium text-gray-500">
                            Type to search
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
                                            `rounded-md px-3 py-2 text-sm ${active
                                                ? "bg-blue-50 text-blue-700"
                                                : "text-gray-700"
                                            } ${selected
                                                ? "bg-blue-50 font-semibold text-blue-700"
                                                : "font-normal"
                                            }`
                                        }
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="min-w-0 flex-1 truncate">
                                                {item.label}
                                            </span>

                                            <button
                                                type="button"
                                                title={
                                                    type === "product"
                                                        ? "Remove Product from selected SAE Grade"
                                                        : `Delete ${ADD_LABELS[type]}`
                                                }
                                                disabled={deletingType === type}
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                }}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleDelete(type, item);
                                                }}
                                                className="flex h-6 w-6 items-center justify-center rounded-full text-red-500 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </ComboboxOption>
                                ))
                            )}
                        </div>
                    </ComboboxOptions>
                </div>
            </Combobox>
        );
    }

    function AddDropdown({
        type,
        options,
        value,
        disabled = false,
    }) {
        const [query, setQuery] = useState("");

        const dropdownList = toDropdownOptions(options);

        const selectedItem =
            dropdownList.find((item) => String(item.value) === String(value)) || null;

        const filteredList =
            query.trim() === ""
                ? dropdownList
                : dropdownList.filter((item) => {
                    return item.label.toLowerCase().includes(query.trim().toLowerCase());
                });

        if (disabled) {
            return (
                <div className="flex h-10 items-center rounded-lg border border-gray-200 bg-gray-100 px-3 text-sm text-gray-500">
                    Select parent value first
                </div>
            );
        }

        if (!dropdownList.length) {
            return (
                <div className="flex h-10 items-center rounded-lg border border-orange-200 bg-orange-50 px-3 text-sm font-medium text-orange-700">
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
            >
                <div className="relative w-full">
                    <ComboboxInput
                        className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pr-12 text-sm font-medium text-gray-900 outline-none placeholder:text-gray-400 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        displayValue={(item) => item?.label || ""}
                        onChange={(event) => setQuery(event.target.value)}
                        onFocus={() => setQuery("")}
                        placeholder={`Search / select ${ADD_LABELS[type]}`}
                    />

                    <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-4 pl-3 text-gray-500">
                        <DropdownArrow />
                    </ComboboxButton>

                    <ComboboxOptions className="absolute z-50 mt-1 max-h-64 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
                        <div className="border-b border-gray-100 bg-gray-50 px-3 py-2 text-[11px] font-medium text-gray-500">
                            Type to search
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

    function AddPanel({
        type,
        options,
        disabled = false,
    }) {
        const selectedValue = selectedAdd[type];
        const dropdownList = toDropdownOptions(options);

        return (
            <div className="mt-2 rounded-lg border border-blue-100 bg-blue-50/60 p-2">
                <div className="mb-2">
                    <h4 className="text-xs font-bold text-gray-900">
                        Add {ADD_LABELS[type]}
                    </h4>

                    <p className="text-[11px] leading-4 text-gray-500">
                        Product list is filtered by published status and Motorcycle Oil Additive category.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto]">
                    <AddDropdown
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
                        className="h-10 rounded-lg bg-green-600 px-5 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
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

    function Section({
        type,
        value,
        onChange,
        options,
        addOptions,
        disabled = false,
    }) {
        const meta = SECTION_META[type];

        return (
            <section className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                <div className="mb-2 flex items-center justify-between gap-3">
                    <div>
                        <h3 className="text-sm font-bold text-gray-900">
                            {meta.title}
                        </h3>

                        {type === "product" && (
                            <p className="text-[11px] text-gray-500">
                                Product can be added into multiple SAE Grades, but only once per selected SAE Grade.
                            </p>
                        )}

                        {type === "jaso" && (
                            <p className="text-[11px] text-gray-500">
                                JASO is saved with both selected SAE Grade and Product.
                            </p>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={() => toggleAdd(type)}
                        disabled={disabled}
                        className={`h-8 rounded-lg px-3 text-xs font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${addMode[type]
                                ? "bg-red-500 hover:bg-red-600"
                                : "bg-blue-600 hover:bg-blue-700"
                            }`}
                    >
                        {addMode[type] ? "Cancel" : meta.addText}
                    </button>
                </div>

                <MainDropdown
                    type={type}
                    value={value}
                    onChange={onChange}
                    options={options}
                    disabled={disabled}
                    placeholder={disabled ? meta.disabledText : meta.emptyText}
                />

                {addMode[type] && (
                    <AddPanel
                        type={type}
                        options={addOptions}
                        disabled={disabled}
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
                            Motorcycle Oil Additive
                        </h1>

                        <p className="mt-1 text-sm text-blue-50">
                            API → SAE Grade → Product → JASO
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-2 p-3 md:grid-cols-2">
                        <InfoBox
                            label="Product Category"
                            value={staticCategory?.label || STATIC_CATEGORY.title}
                        />

                        <InfoBox
                            label="Flow"
                            value="API → SAE Grade → Product → JASO"
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
                            <Section
                                type="api"
                                value={selectedApi}
                                onChange={setSelectedApi}
                                options={apis}
                                addOptions={allApis}
                            />

                            <Section
                                type="saeGrade"
                                value={selectedSaeGrade}
                                onChange={setSelectedSaeGrade}
                                options={saeGrades}
                                addOptions={allSaeGrades}
                                disabled={!selectedApi}
                            />

                            <Section
                                type="product"
                                value={selectedProduct}
                                onChange={setSelectedProduct}
                                options={products}
                                addOptions={allProducts}
                                disabled={!selectedSaeGrade}
                            />

                            <Section
                                type="jaso"
                                value={selectedJaso}
                                onChange={setSelectedJaso}
                                options={jasos}
                                addOptions={allJasos}
                                disabled={!selectedProduct}
                            />
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
                                    label="API"
                                    value={selectedApiObj?.label}
                                />

                                <SummaryRow
                                    label="SAE Grade"
                                    value={selectedSaeObj?.label}
                                />

                                <SummaryRow
                                    label="Product"
                                    value={selectedProductObj?.label}
                                />

                                <SummaryRow
                                    label="JASO"
                                    value={selectedJasoObj?.label}
                                />
                            </div>

                            <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                                Product × only removes Product from selected SAE Grade. It does not delete Product collection record.
                            </div>
                        </aside>

                        <div className="p-32 w-full" />
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
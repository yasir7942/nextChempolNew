"use client";

import { useEffect, useMemo, useState } from "react";

const STATIC_CATEGORY = {
    title: "PCMO/Gasoline",
    slug: "pcmo-gasoline",
};

const initialAddState = {
    api: "",
    saeGrade: "",
    acea: "",
};

export default function AdditivesRelationPage() {
    const [loading, setLoading] = useState(true);
    const [savingType, setSavingType] = useState("");
    const [allApis, setAllApis] = useState([]);

    const [staticCategory, setStaticCategory] = useState({
        label: STATIC_CATEGORY.title,
        slug: STATIC_CATEGORY.slug,
    });

    const [apis, setApis] = useState([]);
    const [saeGrades, setSaeGrades] = useState([]);
    const [aceas, setAceas] = useState([]);

    const [selectedApi, setSelectedApi] = useState("");
    const [selectedApiFromList, setSelectedApiFromList] = useState("");
    const [selectedSaeGrade, setSelectedSaeGrade] = useState("");
    const [selectedAcea, setSelectedAcea] = useState("");

    const [addMode, setAddMode] = useState({
        api: false,
        saeGrade: false,
        acea: false,
    });

    const [addValues, setAddValues] = useState(initialAddState);

    const [message, setMessage] = useState({
        type: "",
        text: "",
    });

    const selectedApiObj = useMemo(
        () => apis.find((item) => String(item.documentId || item.id) === String(selectedApi)) || null,
        [apis, selectedApi]
    );

    const selectedSaeObj = useMemo(
        () =>
            saeGrades.find((item) => String(item.documentId || item.id) === String(selectedSaeGrade)) ||
            null,
        [saeGrades, selectedSaeGrade]
    );

    const selectedAceaObj = useMemo(
        () => aceas.find((item) => String(item.documentId || item.id) === String(selectedAcea)) || null,
        [aceas, selectedAcea]
    );

    function resetMessage() {
        setMessage({ type: "", text: "" });
    }

    function showError(error) {
        console.log("[page] error:", error);
        setMessage({
            type: "error",
            text: error?.message || "Something went wrong",
        });
    }

    function showSuccess(text) {
        console.log("[page] success:", text);
        setMessage({
            type: "success",
            text,
        });
    }

    async function fetchJson(url, options = {}) {
        console.log("--------------------------------------------------");
        console.log("[page fetchJson] URL:", url);
        console.log("[page fetchJson] options:", options);

        const response = await fetch(url, {
            cache: "no-store",
            ...options,
        });

        const text = await response.text();

        console.log("[page fetchJson] status:", response.status);
        console.log("[page fetchJson] first 1000 chars:", text.slice(0, 1000));

        let data = null;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.log("[page fetchJson] JSON parse failed");
            throw new Error("Invalid JSON from API route");
        }

        console.log("[page fetchJson] parsed data:", data);

        if (!response.ok) {
            throw new Error(data?.error || "Request failed");
        }

        return data;
    }

    async function loadStaticCategory() {
        const data = await fetchJson("/api/admin/additives-relation?mode=static-category");
        console.log("[page] static category response:", data);

        setStaticCategory(
            data?.item || {
                label: STATIC_CATEGORY.title,
                slug: STATIC_CATEGORY.slug,
            }
        );
    }


    async function loadAllApis() {
        const data = await fetchJson("/api/admin/additives-relation?mode=allapis");
        console.log("[page] all apis response:", data);
        console.log("[page] all apis items:", data?.items || []);
        setAllApis(data?.items || []);
    }


    async function loadApis() {
        const data = await fetchJson("/api/admin/additives-relation?mode=apis");
        console.log("[page] apis response:", data);
        console.log("[page] apis items:", data?.items || []);
        setApis(data?.items || []);
    }

    async function loadSaeGrades(apiId) {
        if (!apiId) {
            console.log("[page] loadSaeGrades skipped, apiId missing");
            setSaeGrades([]);
            return;
        }

        const data = await fetchJson(
            `/api/admin/additives-relation?mode=sae-grades&apiId=${encodeURIComponent(apiId)}`
        );
        console.log("[page] sae grades response:", data);
        console.log("[page] sae grades items:", data?.items || []);
        setSaeGrades(data?.items || []);
    }

    async function loadAceas(saeGradeId) {
        if (!saeGradeId) {
            console.log("[page] loadAceas skipped, saeGradeId missing");
            setAceas([]);
            return;
        }

        const data = await fetchJson(
            `/api/admin/additives-relation?mode=aceas&saeGradeId=${encodeURIComponent(saeGradeId)}`
        );
        console.log("[page] aceas response:", data);
        console.log("[page] aceas items:", data?.items || []);
        setAceas(data?.items || []);
    }


    useEffect(() => {
        async function init() {
            try {
                console.log("[page] init start");
                setLoading(true);
                resetMessage();
                await Promise.all([loadStaticCategory(), loadApis(), loadAllApis()]);
                console.log("[page] init finished");
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
                console.log("[page] selectedApi changed:", selectedApi);
                resetMessage();

                setSelectedSaeGrade("");
                setSelectedAcea("");
                setSaeGrades([]);
                setAceas([]);

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
                console.log("[page] selectedSaeGrade changed:", selectedSaeGrade);
                resetMessage();

                setSelectedAcea("");
                setAceas([]);

                if (selectedSaeGrade) {
                    await loadAceas(selectedSaeGrade);
                }
            } catch (error) {
                showError(error);
            }
        }

        run();
    }, [selectedSaeGrade]);

    function toggleAdd(type) {
        console.log("[page] toggleAdd:", type);
        setAddMode((prev) => ({
            ...prev,
            [type]: !prev[type],
        }));
    }

    function onChangeAddValue(type, value) {
        console.log("[page] onChangeAddValue:", type, value);
        setAddValues((prev) => ({
            ...prev,
            [type]: value,
        }));
    }

    async function handleAdd(type) {
        try {
            resetMessage();

            const title = String(addValues[type] || "").trim();

            console.log("[page] handleAdd type:", type);
            console.log("[page] handleAdd title:", title);
            console.log("[page] handleAdd selectedApi:", selectedApi);
            console.log("[page] handleAdd selectedApiFromList:", selectedApiFromList);
            console.log("[page] handleAdd selectedSaeGrade:", selectedSaeGrade);

            if (type === "api") {
                if (!selectedApiFromList) {
                    throw new Error("Please select API from list");
                }
            } else {
                if (!title) {
                    throw new Error("Please enter title");
                }
            }

            if (type === "saeGrade" && !selectedApi) {
                throw new Error("Please select API first");
            }

            if (type === "acea" && !selectedSaeGrade) {
                throw new Error("Please select SAE Grade first");
            }

            setSavingType(type);

            const payload = {
                type,
                title: type === "api" ? null : title,
                apiId: type === "api" ? selectedApiFromList : selectedApi || null,
                saeGradeId: selectedSaeGrade || null,
            };

            console.log("[page] POST payload:", payload);

            const data = await fetchJson("/api/admin/additives-relation", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            console.log("[page] POST response data:", data);

            setAddValues((prev) => ({
                ...prev,
                [type]: "",
            }));

            setAddMode((prev) => ({
                ...prev,
                [type]: false,
            }));

            if (type === "api") {
                setSelectedApiFromList("");
                await loadApis();
                await loadAllApis();
                showSuccess("API added successfully");
            }

            if (type === "saeGrade") {
                await loadSaeGrades(selectedApi);
                const newId = data?.item?.documentId || data?.item?.id || "";
                console.log("[page] new SAE Grade id:", newId);
                if (newId) {
                    setSelectedSaeGrade(String(newId));
                }
                showSuccess("SAE Grade added successfully");
            }

            if (type === "acea") {
                await loadAceas(selectedSaeGrade);
                const newId = data?.item?.documentId || data?.item?.id || "";
                console.log("[page] new ACEA id:", newId);
                if (newId) {
                    setSelectedAcea(String(newId));
                }
                showSuccess("ACEA added successfully");
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
                className={`mb-6 rounded-xl border px-4 py-3 text-sm ${message.type === "error"
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-green-200 bg-green-50 text-green-700"
                    }`}
            >
                {message.text}
            </div>
        );
    }

    function renderAddBox(type, placeholder, disabled = false) {
        return (
            <div className="mt-4 flex flex-col gap-3 md:flex-row">
                <input
                    type="text"
                    value={addValues[type]}
                    onChange={(e) => onChangeAddValue(type, e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 disabled:bg-gray-100"
                />
                <button
                    type="button"
                    onClick={() => handleAdd(type)}
                    disabled={disabled || savingType === type}
                    className="rounded-xl bg-green-600 px-5 py-3 font-medium text-white hover:bg-green-700 disabled:opacity-60"
                >
                    {savingType === type ? "Saving..." : "Save"}
                </button>
            </div>
        );
    }

    function renderAddSelectOption(type, placeholder, disabled = false) {
        return (
            <div className="mt-4 flex flex-col gap-3 md:flex-row">
                <select
                    value={selectedApiFromList}
                    onChange={(e) => {
                        console.log("[page] all API dropdown changed:", e.target.value);
                        setSelectedApiFromList(e.target.value);
                    }}
                    disabled={disabled}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-10 outline-none focus:border-blue-500 disabled:bg-gray-100"
                >
                    <option value="">Select API from List</option>
                    {allApis.map((item) => {
                        const value = item.documentId || item.id;
                        return (
                            <option key={value} value={value}>
                                {item.label}
                            </option>
                        );
                    })}
                </select>

                <button
                    type="button"
                    onClick={() => handleAdd(type)}
                    disabled={disabled || savingType === type}
                    className="rounded-xl bg-green-600 px-5 py-3 font-medium text-white hover:bg-green-700 disabled:opacity-60"
                >
                    {savingType === type ? "Saving..." : "Save"}
                </button>
            </div>
        );
    }

    console.log("[page render] staticCategory:", staticCategory);
    console.log("[page render] apis:", apis);
    console.log("[page render] saeGrades:", saeGrades);
    console.log("[page render] aceas:", aceas);
    console.log("[page render] selectedApi:", selectedApi);
    console.log("[page render] selectedSaeGrade:", selectedSaeGrade);
    console.log("[page render] selectedAcea:", selectedAcea);

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="mx-auto max-w-5xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
                <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
                    Additives Relation
                </h1>
                <p className="mt-2 text-sm text-gray-600">
                    Fixed Product Category → API → SAE Grade → ACEA
                </p>

                <div className="mt-6">{renderMessage()}</div>

                {loading ? (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-6 text-gray-600">
                        Loading...
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="rounded-2xl border border-gray-200 bg-blue-50 p-4">
                            <div className="text-sm font-semibold text-gray-800">Product Category</div>
                            <div className="mt-2 text-lg font-bold text-blue-700">
                                {staticCategory?.label || STATIC_CATEGORY.title}
                            </div>
                            <div className="mt-1 text-xs text-gray-600">
                                Slug: {staticCategory?.slug || STATIC_CATEGORY.slug}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-gray-200 p-4">
                            <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <label className="text-sm font-semibold text-gray-800">API</label>
                                <button
                                    type="button"
                                    onClick={() => toggleAdd("api")}
                                    className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${addMode.api ? "bg-red-400 hover:bg-red-600" : "bg-gray-700 hover:bg-gray-500"
                                        }`}
                                >
                                    {addMode.api ? "Cancel" : "Add API"}
                                </button>
                            </div>

                            <select
                                value={selectedApi}
                                onChange={(e) => {
                                    console.log("[page] API dropdown changed:", e.target.value);
                                    setSelectedApi(e.target.value);
                                }}
                                className=" w-full appearance rounded-xl border border-gray-300 px-4 pr-10 py-3 outline-none focus:border-blue-500 bg-white"
                            >
                                <option value="">Select API</option>
                                {apis.map((item) => {
                                    const value = item.documentId || item.id;
                                    return (
                                        <option key={value} value={value}>
                                            {item.label}
                                        </option>
                                    );
                                })}
                            </select>

                            {addMode.api && renderAddSelectOption("api", "Enter API name")}
                        </div>

                        <div className="rounded-2xl border border-gray-200 p-4">
                            <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <label className="text-sm font-semibold text-gray-800">
                                    SAE Grade
                                </label>
                                <button
                                    type="button"
                                    onClick={() => toggleAdd("saeGrade")}
                                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                >
                                    {addMode.saeGrade ? "Cancel" : "Add SAE Grade"}
                                </button>
                            </div>

                            <select
                                value={selectedSaeGrade}
                                onChange={(e) => {
                                    console.log("[page] SAE Grade dropdown changed:", e.target.value);
                                    setSelectedSaeGrade(e.target.value);
                                }}
                                disabled={!selectedApi}
                                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 disabled:bg-gray-100"
                            >
                                <option value="">
                                    {selectedApi ? "Select SAE Grade" : "Select API first"}
                                </option>
                                {saeGrades.map((item) => {
                                    const value = item.documentId || item.id;
                                    return (
                                        <option key={value} value={value}>
                                            {item.label}
                                        </option>
                                    );
                                })}
                            </select>

                            {addMode.saeGrade &&
                                renderAddBox("saeGrade", "Enter SAE Grade name", !selectedApi)}
                        </div>

                        <div className="rounded-2xl border border-gray-200 p-4">
                            <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <label className="text-sm font-semibold text-gray-800">ACEA</label>
                                <button
                                    type="button"
                                    onClick={() => toggleAdd("acea")}
                                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                >
                                    {addMode.acea ? "Cancel" : "Add ACEA"}
                                </button>
                            </div>

                            <select
                                value={selectedAcea}
                                onChange={(e) => {
                                    console.log("[page] ACEA dropdown changed:", e.target.value);
                                    setSelectedAcea(e.target.value);
                                }}
                                disabled={!selectedSaeGrade}
                                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 disabled:bg-gray-100"
                            >
                                <option value="">
                                    {selectedSaeGrade ? "Select ACEA" : "Select SAE Grade first"}
                                </option>
                                {aceas.map((item) => {
                                    const value = item.documentId || item.id;
                                    return (
                                        <option key={value} value={value}>
                                            {item.label}
                                        </option>
                                    );
                                })}
                            </select>

                            {addMode.acea &&
                                renderAddBox("acea", "Enter ACEA name", !selectedSaeGrade)}
                        </div>

                        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4">
                            <h2 className="text-lg font-semibold text-gray-900">Selected Data</h2>

                            <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-gray-700 md:grid-cols-2">
                                <div>
                                    <span className="font-semibold">Product Category:</span>{" "}
                                    {staticCategory?.label || STATIC_CATEGORY.title}
                                </div>
                                <div>
                                    <span className="font-semibold">API:</span>{" "}
                                    {selectedApiObj?.label || "—"}
                                </div>
                                <div>
                                    <span className="font-semibold">SAE Grade:</span>{" "}
                                    {selectedSaeObj?.label || "—"}
                                </div>
                                <div>
                                    <span className="font-semibold">ACEA:</span>{" "}
                                    {selectedAceaObj?.label || "—"}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
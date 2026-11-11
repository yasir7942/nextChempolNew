'use client';

import { getFileUrl, getImageUrl } from "@/libs/helper";
import Image from "next/image";
import React, { useEffect, useState } from 'react';

// Products come from the report (one request for the whole page), so this only renders
const LANGUAGE_NAMES = { ar: "Arabic", es: "Spanish" };

// What a product still needs for a complete page. Each entry: what to add, shown in the Health popup.
function productHealth(product) {
    const todo = [];
    if (!product.hasDescription) todo.push("Add a description");
    if (!(product.faqCount > 0)) todo.push("Add FAQs (question and answer)");
    if (!product.seoTitle) todo.push("Add an SEO title");
    if (!product.seoDescription) todo.push("Add an SEO description");
    for (const [locale, name] of Object.entries(LANGUAGE_NAMES)) {
        const status = product.translations?.[locale];
        if (!status || status.status === "none") todo.push(`Add the ${name} translation`);
        else if (status.status === "incomplete") todo.push(`Complete the ${name} translation (missing: ${status.missing.join(", ")})`);
    }
    if (!product.TDSFile?.url) todo.push("Upload the TDS file");
    if (!product.MSDSFile?.url) todo.push("Upload the MSDS file");
    if (!product.productImage?.url) todo.push("Add a product image");
    if (!String(product.productImage?.alternativeText ?? "").trim()) todo.push("Add the image ALT text");

    // green: nothing to add, yellow: up to 3 things, red: more
    return { todo, level: todo.length === 0 ? "green" : todo.length <= 3 ? "yellow" : "red" };
}

// Green tick when complete, otherwise a yellow / red button that lists what to add
const HealthStatus = ({ product }) => {
    const [open, setOpen] = useState(false);
    const { todo, level } = productHealth(product);

    useEffect(() => {
        if (!open) return;
        const onKey = (event) => event.key === "Escape" && setOpen(false);
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open]);

    if (level === "green") {
        return <span role="img" aria-label="Health good" title="Complete" className="text-lg font-bold text-green-600">&#10003;</span>;
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                title="Show what to add"
                className={`rounded px-2 py-0.5 text-xs font-bold ${level === "red" ? "bg-red-600 text-white hover:bg-red-500" : "bg-yellow-400 text-yellow-950 hover:bg-yellow-300"}`}
            >
                {todo.length} to fix
            </button>
            {open && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
                    <div role="dialog" aria-modal="true" aria-label="Improve product health" className="w-full max-w-md rounded-lg bg-white p-5 text-left text-gray-900 shadow-xl">
                        <div className="flex items-start justify-between gap-4">
                            <h3 className="text-base font-semibold">Improve health</h3>
                            <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="px-1 text-xl leading-none text-gray-500 hover:text-gray-900">&times;</button>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">{product.title}</p>
                        <p className="mt-3 text-sm">Add these to improve this product&apos;s health:</p>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                            {todo.map((item) => <li key={item}>{item}</li>)}
                        </ul>
                    </div>
                </div>
            )}
        </>
    );
};

// Translation status: green tick (complete), red cross (no translation),
// yellow ! button (incomplete) that opens the list of missing fields. Only the yellow one is clickable.
const TranslationStatus = ({ locale, status }) => {
    const [open, setOpen] = useState(false);
    const name = LANGUAGE_NAMES[locale];

    useEffect(() => {
        if (!open) return;
        const onKey = (event) => event.key === "Escape" && setOpen(false);
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open]);

    if (!status || status.status === "none") {
        return <span role="img" aria-label={`${name} translation not available`} title="Not available" className="text-lg font-bold text-red-600">&#10005;</span>;
    }
    if (status.status === "complete") {
        return <span role="img" aria-label={`${name} translation complete`} title="Complete" className="text-lg font-bold text-green-600">&#10003;</span>;
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label={`${name} translation has ${status.missing.length} missing field${status.missing.length === 1 ? "" : "s"}. Show list`}
                title="Missing fields"
                className="inline-flex h-6 w-6 items-center justify-center rounded bg-yellow-400 text-sm font-extrabold text-yellow-950 hover:bg-yellow-300"
            >
                !
            </button>
            {open && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
                    <div role="dialog" aria-modal="true" aria-label={`${name} Translation - Missing Fields`} className="w-full max-w-md rounded-lg bg-white p-5 text-left text-gray-900 shadow-xl">
                        <div className="flex items-start justify-between gap-4">
                            <h3 className="text-base font-semibold">{name} Translation &ndash; Missing Fields</h3>
                            <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="px-1 text-xl leading-none text-gray-500 hover:text-gray-900">&times;</button>
                        </div>
                        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                            {status.missing.map((field) => <li key={field}>{field}</li>)}
                        </ul>
                    </div>
                </div>
            )}
        </>
    );
};

// Button that opens a popup with a long text (SEO title / description)
const TextPopupButton = ({ label, heading, text }) => {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!open) return;
        const onKey = (event) => event.key === "Escape" && setOpen(false);
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open]);

    if (!text) return <div className="text-center text-red-500"> --- </div>;

    return (
        <>
            <button type="button" onClick={() => setOpen(true)} className="rounded border border-gray-400 px-2 py-0.5 text-xs font-medium text-gray-800 hover:bg-gray-100">
                {label}
            </button>
            {open && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
                    <div role="dialog" aria-modal="true" aria-label={label} className="w-full max-w-lg rounded-lg bg-white p-5 text-left text-gray-900 shadow-xl">
                        <div className="flex items-start justify-between gap-4">
                            <h3 className="text-base font-semibold">{label}</h3>
                            <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="px-1 text-xl leading-none text-gray-500 hover:text-gray-900">&times;</button>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">{heading}</p>
                        <p className="mt-3 whitespace-pre-line break-words text-sm">{text}</p>
                        <p className="mt-3 text-xs text-gray-500">{text.length} characters</p>
                    </div>
                </div>
            )}
        </>
    );
};

// postCount: posts linked to the category these products are listed in (undefined for uncategorized products)
const ProductReportTable = ({ Type, products = [], postCount }) => {
    const childProducts = { products: { data: Array.isArray(products) ? products : [] } };

    return (
        <table className={`table-auto w-full border-collapse border border-gray-300 ${Type === "child" ? "text-gray-950" : "text-red-700"}`}>
            <thead>
                <tr>
                    <th className="border border-gray-300 text-sm">P. Id</th>
                    <th className="border border-gray-300 text-sm">Title</th>
                    <th className="border border-gray-300 text-sm">Slug</th>
 <th className="border border-gray-300 text-sm">ShortDescription</th>
                    <th className="border border-gray-300 text-sm">Block Index</th>
                    <th className="border border-gray-300 text-sm">FAQs</th>
                    <th className="border border-gray-300 text-sm">SEOTitle</th>
                    <th className="border border-gray-300 text-sm">SEODescription</th>
                    <th className="border border-gray-300 text-sm">Arabic</th>
                    <th className="border border-gray-300 text-sm">Spanish</th>
                    <th className="border border-gray-300 text-sm">TDSFile</th>
                    <th className="border border-gray-300 text-sm">MSDSFile</th>
                    <th className="border border-gray-300 text-sm">Image</th>
                    <th className="border border-gray-300 text-sm">Image ALT Text</th>
                    <th className="border border-gray-300 text-sm">Posts</th>
                    <th className="border border-gray-300 text-sm">Health</th>
                </tr>
            </thead>
            {Array.isArray(childProducts.products?.data) && childProducts.products.data.length > 0 ? (
                <tbody className={`${Type === "child" ? "text-green-800" : ""}`}>
                    {childProducts.products.data.map((product) => (
                        <tr key={product.id} className={product.publishedAt === null ? 'hidden' : ''}>
                            <td className="border text-sm border-gray-300 text-center font-semibold">
                                {product.id || <div className="text-center text-red-500"> --- </div>}
                            </td>
                            <td className="border text-sm font-light border-gray-300">
                                {product.publishedAt === null ? 'Deleted ' : ''}
                                <a
                                    rel="nofollow"
                                    href={product.publishedAt === null ? '#' : `/en/product/${product.slug}/`}
                                    className={product.publishedAt === null ? 'no-underline cursor-not-allowed pointer-events-none' : 'underline'}
                                    target="_blank"
                                >
                                    {product.title}
                                </a>
                            </td>
                            <td className="border text-sm font-light border-gray-300 text-center">
                                <TextPopupButton label="Slug" heading={product.title} text={product.slug} />
                            </td>
                            <td className="border text-sm font-light border-gray-300 text-center">
                                {product.hasShortDescription ? <span className="font-medium text-green-700">Yes</span> : <div className="text-center text-red-500"> --- </div>}
                            </td>
                            <td className="border text-sm font-light border-gray-300 text-center">
                                {product.blockIndex ? <span className="font-semibold text-red-600">true</span> : <span className="text-gray-700">false</span>}
                            </td>
                            <td className="border text-sm font-light border-gray-300 text-center">
                                {product.faqCount > 0 ? <span className="font-medium text-green-700">{product.faqCount}</span> : <div className="text-center text-red-500"> --- </div>}
                            </td>
                            <td className="border text-sm font-light border-gray-300 text-center">
                                <TextPopupButton label="SEO Title" heading={product.title} text={product.seoTitle} />
                            </td>
                            <td className="border text-sm font-light border-gray-300 text-center">
                                <TextPopupButton label="SEO Description" heading={product.title} text={product.seoDescription} />
                            </td>
                            <td className="border text-sm font-light border-gray-300 text-center">
                                <TranslationStatus locale="ar" status={product.translations?.ar} />
                            </td>
                            <td className="border text-sm font-light border-gray-300 text-center">
                                <TranslationStatus locale="es" status={product.translations?.es} />
                            </td>
                            <td className="border text-sm font-light border-gray-300">
                                {product.TDSFile?.url ? (
                                    <a
                                        href={getFileUrl(product.TDSFile.url)}
                                        className="underline uppercase"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        TDS {product.TDSFile.url.split('.').pop()}
                                    </a>
                                ) : (
                                    <div className="text-center text-red-500"> --- </div>
                                )}
                            </td>
                            <td className="border text-sm font-light border-gray-300">
                                {product.MSDSFile?.url ? (
                                    <a
                                        href={getFileUrl(product.MSDSFile.url)}
                                        className="underline uppercase"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        MSDS {product.MSDSFile.url.split('.').pop()}
                                    </a>
                                ) : (
                                    <div className="text-center text-red-500"> --- </div>
                                )}
                            </td>
                            <td className="border text-sm font-light flex items-center justify-center">
                                {product.productImage?.url ? (
                                    <Image
                                        className="w-6 hover:scale-[8] hover:cursor-pointer transition-transform duration-500"
                                        src={getImageUrl(product.productImage.url)}
                                        height={250}
                                        width={250}
                                        alt="product image"
                                        priority
                                    />
                                ) : (
                                    <div className="text-center text-red-500"> --- </div>
                                )}
                            </td>
                            <td className="border text-sm font-light border-gray-300 text-center">
                                <TextPopupButton label="Image ALT Text" heading={product.title} text={String(product.productImage?.alternativeText ?? "").trim()} />
                            </td>
                            <td className="border text-sm font-light border-gray-300 text-center">
                                {postCount > 0 ? <span className="font-medium text-green-700">{postCount}</span> : <div className="text-center text-red-500"> --- </div>}
                            </td>
                            <td className="border text-sm font-light border-gray-300 text-center">
                                <HealthStatus product={product} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            ) : (
                <tbody>
                    <tr>
                        <td colSpan={16} className="text-center py-4 text-red-500">
                            No Products Available
                        </td>
                    </tr>
                </tbody>
            )}
        </table>
    );
};

export default ProductReportTable;

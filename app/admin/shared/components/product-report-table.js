'use client';

import { getFileUrl, getImageUrl } from "@/libs/helper";
import Image from "next/image";
import React from 'react';

// Products come from the report (one request for the whole page), so this only renders
const ProductReportTable = ({ Type, products = [] }) => {
    const childProducts = { products: { data: Array.isArray(products) ? products : [] } };

    return (
        <table className={`table-auto w-full border-collapse border border-gray-300 ${Type === "child" ? "text-gray-950" : "text-red-700"}`}>
            <thead>
                <tr>
                    <th className="border border-gray-300 text-sm">P. Id</th>
                    <th className="border border-gray-300 text-sm">Title</th>
                    <th className="border border-gray-300 text-sm">Name</th>
                    <th className="border border-gray-300 text-sm">Action</th>
                    <th className="border border-gray-300 text-sm">Grade/Line 1</th>
                    <th className="border border-gray-300 text-sm">API/Line 2</th>
                    <th className="border border-gray-300 text-sm">acea/Line 3</th>
                    <th className="border border-gray-300 text-sm">Packing</th>
                    <th className="border border-gray-300 text-sm">TDSFile</th>
                    <th className="border border-gray-300 text-sm">MSDSFile</th>
                    <th className="border border-gray-300 text-sm">Image</th>
                    <th className="border border-gray-300 text-sm">SEO ALT</th>
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
                            <td className="border text-sm font-light border-gray-300">
                                {product.name || <div className="text-center text-red-500"> --- </div>}
                            </td>
                            <td className="border text-sm font-light border-gray-300">
                                <a
                                    href={`${(process.env.NEXT_PUBLIC_ADMIN_BASE_URL || "").replace(/\/+$/, "")}/admin/content-manager/collection-types/api::product.product/${product.documentId || product.id}?plugins[i18n][locale]=en`}
                                    className="underline"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Edit
                                </a>
                            </td>
                            <td className="border text-sm font-light border-gray-300">
                                {product.grade || <div className="text-center text-red-500"> --- </div>}
                            </td>
                            <td className="border text-sm font-light border-gray-300">
                                {product.api || <div className="text-center text-red-500"> --- </div>}
                            </td>
                            <td className="border text-sm font-light border-gray-300">
                                {product.acea || <div className="text-center text-red-500"> --- </div>}
                            </td>
                            <td className="border text-sm font-light border-gray-300">
                                {product.packing || <div className="text-center text-red-500"> --- </div>}
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
                            <td className="border text-sm font-light border-gray-300">
                                {product.productImage?.alternativeText || <div className="text-center text-red-500"> --- </div>}
                            </td>
                        </tr>
                    ))}
                </tbody>
            ) : (
                <tbody>
                    <tr>
                        <td colSpan={12} className="text-center py-4 text-red-500">
                            No Products Available
                        </td>
                    </tr>
                </tbody>
            )}
        </table>
    );
};

export default ProductReportTable;

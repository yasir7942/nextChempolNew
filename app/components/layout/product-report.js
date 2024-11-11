"use client";
import { getProductCategoryList } from "@/app/data/loader";
import { getImageUrl } from "@/libs/helper";
import Image from "next/image";
import React, { useState, useEffect } from 'react';
import { MagnifyingGlass } from "react-loader-spinner";

const ReadProductReport = () => {
    const [productCategory, setProductCategory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const productCategoryData = await getProductCategoryList();
                setProductCategory(productCategoryData);
            } catch (e) {
                setError(e);
                console.error('An error occurred while fetching the data: ', e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div className="flex flex-row  items-center justify-center mt-5 pb-16">
        <p className="font-normal text-xl text-[#BE1D21] text-center">Compiling data, please wait a moment.......</p>
        <div className="pt-2">
            <MagnifyingGlass
                visible={true}
                height="80"
                width="80"
                ariaLabel="magnifying-glass-loading"
                wrapperStyle={{}}
                wrapperClass="magnifying-glass-wrapper"
                glassColor="#FFFFFF"
                color="#BE1D21"
            /> </div>
    </div>;
    if (error) return <p>Error: {error.message}</p>;

    return (
        <div className="overflow-x-auto font-serif">

            {productCategory.data.map((category) => (
                <div key={category.id}>
                    <div className="pb-2 pl-1">{category.title || "No Title"}</div>
                    <table className="table-auto w-full border-collapse border  border-gray-200 text-gray-950">
                        <thead>
                            <tr>
                                <th className="border border-gray-200 text-sm">Id</th>
                                <th className="border border-gray-200 text-sm">Title</th>
                                <th className="border border-gray-200 text-sm">TDSFile</th>
                                <th className="border border-gray-200 text-sm">MSDSFile</th>
                                <th className="border border-gray-200 text-sm">Image</th>
                                <th className="border border-gray-200 text-sm">SEO ALT</th>
                            </tr>
                        </thead>
                        <tbody>
                            {category.products?.data?.map((product) => (
                                <tr key={product.id}>
                                    <td className="border text-sm font-light border-gray-200 text-center">
                                        {product.id || <div className="text-center text-red-500"> --- </div>}
                                    </td>
                                    <td className="border text-sm font-light border-gray-200">
                                        {<a href={`/product/${product.slug}`} className="underline" target="_blank" > {product.title} </a> || <div className="text-center text-red-500"> --- </div>}
                                    </td>

                                    <td className="border text-sm font-light border-gray-200">
                                        {product.TDSFile?.url ? (
                                            <a href={`${process.env.NEXT_PUBLIC_ADMIN_BASE_URL}${product.TDSFile.url}`} className="underline" target="_blank" rel="noopener noreferrer">
                                                TDS PDF
                                            </a>
                                        ) : (
                                            <div className="text-center text-red-500"> --- </div>
                                        )}
                                    </td>
                                    <td className="border text-sm font-light border-gray-200">
                                        {product.MSDSFile?.url ? (
                                            <a href={`${process.env.NEXT_PUBLIC_ADMIN_BASE_URL}${product.MSDSFile.url}`} className="underline" target="_blank" rel="noopener noreferrer">
                                                MSDS PDF
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
                                    <td className="border text-sm font-light border-gray-200">
                                        {product.productImage?.alternativeText || <div className="text-center text-gray-400"> title Auto Display </div>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <br /><br />
                </div>
            ))}
        </div>
    );
};

export default ReadProductReport;

"use client";
import { getRedirectLinks } from "@/app/data/loader";

import React, { useState, useEffect } from 'react';


const RedirectLinkReport = () => {
    const [redirectLinks, setRedirectLinks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const redirectLinksData = await getRedirectLinks();

                setRedirectLinks(redirectLinksData);





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

    </div>;
    if (error) return <p>Error: {error.message}</p>;

    return (
        <div className="overflow-x-auto font-serif  p-36">

            {redirectLinks.data.map((links) => (
                <div key={links.id}>
                    Redirect 301 {links.source} {links.destination}

                    <br />
                </div>
            ))
            }
        </div >
    );
};

export default RedirectLinkReport;

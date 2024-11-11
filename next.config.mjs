/** @type {import('next').NextConfig} */


import fetchRedirects from './libs/fetch-redirects.mjs';

const getRedirects = async () => {
    const redirectsData = await fetchRedirects(); // Access the function via the imported module object
    return redirectsData;
};


let unOptimized = true;
let fileRoutes = true;

if (process.env.MODE === "pro") {
    unOptimized = false;
    fileRoutes = false;
}





const nextConfig = {

    reactStrictMode: true,

    // useFileSystemPublicRoutes: fileRoutes,



    images: {
        unoptimized: unOptimized,   //false in in live server make webp images 
        remotePatterns: [
            {
                hostname: "front.chempol.co.uk",
                protocol: "https",
            },
            {
                hostname: "chempolco.uk",
                protocol: "https",
            },
            {
                hostname: "admin.chempol.co.uk",
                protocol: "https",
            },
            {
                hostname: "localhost",
                protocol: "http",
            }
        ],
    },

    async redirects() {
        return await getRedirects();
    },




};

export default nextConfig;


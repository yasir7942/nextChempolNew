/** @type {import('next').NextConfig} */

//import fetchRedirects from './libs/fetch-redirects.mjs';

let unOptimized = true;
let fileRoutes = true;

if (process.env.MODE === "pro") {
    unOptimized = false;
    fileRoutes = false;
}

// Fetch redirects synchronously before exporting nextConfig
/*let redirectsList = [];

async function loadRedirects() {
    redirectsList = await fetchRedirects();
} */

//await loadRedirects(); // Fetch redirects before exporting

const nextConfig = {
    reactStrictMode: true,
    trailingSlash: true,
    images: {
        unoptimized: unOptimized,
        remotePatterns: [
            { hostname: "front.chempol.co.uk", protocol: "https" },
            { hostname: "chempolco.uk", protocol: "https" },
            { hostname: "admin.chempol.co.uk", protocol: "https" },
            { hostname: "localhost", protocol: "http" },
            { hostname: "youtube.com", protocol: "https" },
            { hostname: "i.ytimg.com", protocol: "https" },
            { hostname: "newadmin.chempol.co.uk", protocol: "https" }



        ],
    },
    /* redirects() {
 
          
 
 
         return redirectsList;
     },  */
};

export default nextConfig;

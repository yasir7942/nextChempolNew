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
    skipTrailingSlashRedirect: true,
    experimental: {
        // app/global-not-found.js: 404 page for a site with several root layouts
        // ([lang] sets <html lang> per language).
        globalNotFound: true,
    },

    // Admin reports stay out of search engines (also set as <meta name="robots"> on the pages)
    async headers() {
        const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];
        return [
            { source: "/admin", headers: noindex },
            { source: "/admin/:path*", headers: noindex },
            { source: "/api/redirects", headers: noindex },
            { source: "/api/admin/:path*", headers: noindex },
        ];
    },

    // Report pages moved from /<lang>/ to /admin; keep old links and bookmarks working
    async redirects() {
        return [
            { source: "/:lang(en|ar|es)/product-report", destination: "/admin/product-report/", permanent: true },
            { source: "/:lang(en|ar|es)/redirectlinks", destination: "/admin/redirectlinks/", permanent: true },
            { source: "/product-report", destination: "/admin/product-report/", permanent: true },
            { source: "/redirectlinks", destination: "/admin/redirectlinks/", permanent: true },
        ];
    },
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

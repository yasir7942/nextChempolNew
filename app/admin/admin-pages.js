import { ArrowRightLeft, FileBarChart2, PlaySquare } from "lucide-react";

// Admin pages are reports, not content: keep them out of search engines.
// The admin pages use plain metadata (libs/metadata.js adds /en/ canonical and hreflang links).
export const ADMIN_ROBOTS = { index: false, follow: false };

// Report pages under /admin, used by the dashboard buttons (/admin/reports/) and the admin menu
export const ADMIN_PAGES = [
  {
    href: "/admin/product-report/",
    title: "Product Report",
    description:
      "Product category placement, empty categories, missing category media and uncategorized products.",
    Icon: FileBarChart2,
  },
  {
    href: "/admin/redirectlinks/",
    title: "Redirect Links",
    description:
      "Every redirect saved in Strapi, which ones are live on the site (301) and why the others are skipped.",
    Icon: ArrowRightLeft,
  },
  {
    href: "/admin/reports/youtube/",
    title: "YouTube",
    description:
      "Every YouTube video in Strapi: add, edit, hide or delete videos and fetch new uploads from the channel.",
    Icon: PlaySquare,
  },
];

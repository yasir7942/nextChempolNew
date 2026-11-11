import Link from "next/link";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";
import { localizeNumber } from "@/libs/helper";

const BOX = "inline-flex h-10 min-w-10 items-center justify-center rounded-md px-3 text-sm font-medium";

// Server-rendered pagination with real links, so search engines can follow every page.
// hrefFor(n) returns the URL of page n.
const LinkPagination = ({ page, pageCount, hrefFor, locale = "en", label = "Page" }) => {
    if (pageCount <= 1) return null;

    const pages = Array.from({ length: pageCount }, (_, index) => index + 1);
    const arrow = (target, Icon, text) =>
        target >= 1 && target <= pageCount ? (
            <Link href={hrefFor(target)} aria-label={text} className={`${BOX} text-gray-900 hover:bg-gray-100`}>
                <Icon size={18} />
            </Link>
        ) : (
            <span aria-hidden="true" className={`${BOX} text-gray-900 opacity-20`}>
                <Icon size={18} />
            </span>
        );

    return (
        <nav
            aria-label={`${label} ${localizeNumber(locale, page)} / ${localizeNumber(locale, pageCount)}`}
            className="mt-10 mb-16 pt-10 flex flex-wrap items-center justify-center gap-2"
            dir="ltr"
        >
            {arrow(page - 1, FaChevronLeft, "Previous page")}
            {pages.map((number) =>
                number === page ? (
                    <span key={number} aria-current="page" className={`${BOX} bg-gray-900 text-white`}>
                        {localizeNumber(locale, number)}
                    </span>
                ) : (
                    <Link key={number} href={hrefFor(number)} className={`${BOX} text-gray-800 hover:bg-gray-100`}>
                        {localizeNumber(locale, number)}
                    </Link>
                )
            )}
            {arrow(page + 1, FaChevronRight, "Next page")}
        </nav>
    );
};

export default LinkPagination;

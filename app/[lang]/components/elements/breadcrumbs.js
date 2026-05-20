import Link from "next/link";

export default function Breadcrumbs({ breadcrumbs = [] }) {



    return (
        <nav aria-label="Breadcrumb" className="text-sm text-gray-700 mb-4">
            <ol className="flex flex-wrap items-center space-x-1">
                {breadcrumbs.map((crumb, index) => {
                    const isLast = index === breadcrumbs.length - 1;
                    //console.log(crumb)
                    return (
                        <li key={index} className="flex items-center space-x-1 py-3">
                            {crumb.url && !isLast ? (
                                <>
                                    <Link href={`${crumb.url}`} className="text-[var(--primary)] hover:underline">
                                        {crumb.title}
                                    </Link>
                                    <span className="mx-1">/</span>
                                </>
                            ) : (
                                <span className="text-gray-900">{crumb.title}</span>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav >
    );
}
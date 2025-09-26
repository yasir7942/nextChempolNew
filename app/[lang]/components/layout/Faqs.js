"use client";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

const FAQs = ({ dictionary, faqList = [], heading = "", text = "", page = "category" }) => {
    // Safe access + fallbacks
    const nav = dictionary?.navigation || {};
    const labelQ = nav.q ?? "Q";
    const labelA = nav.a ?? "A";

    const hasFaqs = Array.isArray(faqList) && faqList.length > 0;

    // JSON-LD only when we actually have FAQs
    const jsonLd = hasFaqs
        ? {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqList.map((data) => ({
                "@type": "Question",
                name: data?.question ?? "",
                acceptedAnswer: {
                    "@type": "Answer",
                    text: data?.answer ?? "",
                },
            })),
        }
        : null;

    return (
        <>
            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}

            <div className="w-full mt-10 mb-10 text-center h-auto">


                {text ? (
                    <p className="text-gray-800 text-left rtl:text-center md:text-center font-light py-0 summary text-base md:text-lg">
                        {text}
                    </p>
                ) : null}

                {hasFaqs ? (
                    <Accordion type="single" collapsible>
                        {faqList.map((data, idx) => {
                            const question = data?.question ?? "";
                            const answer = data?.answer ?? "";
                            // shadcn's AccordionItem `value` must be a string
                            const value = String(data?.id ?? idx);

                            return (
                                <AccordionItem key={value} value={value}>
                                    <AccordionTrigger className="text-black text-left text-base font-normal rtl:text-right headline">
                                        {labelQ}: {question}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-black text-left text-base font-light rtl:text-right summary">
                                        {labelA}: {answer}
                                    </AccordionContent>
                                </AccordionItem>
                            );
                        })}
                    </Accordion>
                ) : (
                    ""
                )}
            </div>
        </>
    );
};

export default FAQs;

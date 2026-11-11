"use client";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

// FAQPage JSON-LD is built on the server by each page (buildFaqPage), so it is in
// the HTML even when this list sits inside a closed accordion.
const FAQs = ({ dictionary, faqList = [], heading = "", text = "", page = "category" }) => {
    // Safe access + fallbacks
    const nav = dictionary?.navigation || {};
    const labelQ = nav.q ?? "Q";
    const labelA = nav.a ?? "A";

    const hasFaqs = Array.isArray(faqList) && faqList.length > 0;

    return (
        <>
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

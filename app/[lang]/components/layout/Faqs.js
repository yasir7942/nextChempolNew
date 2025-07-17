
"use client";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"



const FAQs = ({ dictionary, faqList, heading = "", text = "" }) => {


    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqList.map((data) => ({
            "@type": "Question",
            "name": data.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": data.answer,
            },
        })),
    };


    return (
        <>
            <script type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            <div className="w-full mt-10 mb-10 text-center h-auto ">

                <h4 className="w-full text-textBlue text-left rtl:text-center md:text-center text-xl font-semibold "  >{heading}</h4>
                <p className="text-gray-800 text-left rtl:text-center md:text-center font-light py-0 summary text-base md:text-lg ">{text}</p>

                <Accordion type="single" collapsible>
                    {faqList.map((data) => (
                        <AccordionItem key={data.id} value={data.id}>
                            <AccordionTrigger className="  text-black text-left  text-base font-normal rtl:text-right" >{dictionary.navigation.q} {data.question}</AccordionTrigger>
                            <AccordionContent className="  text-black text-left  text-base font-light rtl:text-right" >
                                {dictionary.navigation.a} {data.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}

                </Accordion>

            </div >
        </>
    )
}

export default FAQs






"use client";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import PaddingContainer from "./padding-container";
import BodyDataParse from "../elements/data-parse-content";
import FAQs from "./Faqs";


const SingleTab = ({ faqList = [], heading = "", text = "" }) => {




    return (
        <>


            <div className="w-full mt-3 mb-3 text-center h-auto">


                <Accordion type="single" collapsible  >

                    <AccordionItem value="1" className="w-full"  >
                        <AccordionTrigger className=" no-underline hover:no-underline   text-black text-left  text-base font-normal  border border-1 border-blue-400 shadow-md rounded-sm p-4" >{heading}</AccordionTrigger>
                        <AccordionContent className="  text-black text-left  text-base font-light   " >
                            {text && <div className="text-black font-normal text-sm  pb-10 rich-text   border border-1 border-gray-300 shadow-lg mt-5  p-4">
                                <BodyDataParse content={text} />
                            </div>}

                            <FAQs faqList={faqList} heading="" text="" />

                        </AccordionContent>
                    </AccordionItem>


                </Accordion>

            </div >
        </>
    )
}

export default SingleTab





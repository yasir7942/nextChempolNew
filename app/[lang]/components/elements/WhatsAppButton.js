"use client";
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const WhatsAppButton = () => {
    const [isClient, setIsClient] = useState(false);
    const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
    // Ensure the code runs only on the client side
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Render the button using createPortal if on the client side
    if (!isClient) return null;

    const button = (
        <div
            className="fixed bottom-12 right-4 z-[2147483647] pointer-events-auto"
            style={{ position: 'fixed', zIndex: 2147483647 }}
        >
            <a
                //href="https://wa.me/+447548378089"
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-14 h-14 bg-green-500 rounded-full shadow-lg hover:bg-green-600 transition"
                aria-label="Chat on WhatsApp"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="white"
                    width="32px"
                    height="32px"
                >
                    <path d="M12 2C6.486 2 2 6.486 2 12c0 1.956.523 3.797 1.523 5.402l-1.374 4.862 4.995-1.44C8.73 22.475 10.341 23 12 23c5.514 0 10-4.486 10-10S17.514 2 12 2zm.005 18c-1.528 0-3.033-.43-4.315-1.235l-.309-.193-3.027.873.826-2.926-.2-.316C4.437 14.878 4 13.465 4 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-7.995 8zm3.765-5.373c-.205-.103-1.205-.592-1.39-.658-.184-.067-.319-.103-.454.103-.134.205-.52.657-.637.793-.118.135-.234.152-.439.05-.205-.103-.867-.317-1.652-1.01-.611-.536-1.021-1.2-1.138-1.405-.118-.205-.012-.316.092-.419.095-.095.205-.234.307-.35.103-.118.135-.202.205-.337.067-.134.034-.253-.017-.353-.05-.103-.439-1.06-.602-1.455-.158-.384-.318-.33-.438-.33-.118 0-.252-.017-.386-.017s-.353.05-.539.252c-.184.202-.703.688-.703 1.678s.72 1.947.82 2.08c.101.134 1.416 2.16 3.432 3.03.48.207.854.33 1.145.425.48.152.916.13 1.26.078.385-.058 1.205-.492 1.375-.967.17-.476.17-.885.118-.967-.05-.083-.186-.135-.39-.237z" />
                </svg>
            </a>
        </div>
    );

    return createPortal(button, document.body);
};

export default WhatsAppButton;

'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import Image from 'next/image';


const LangSwitcher = ({ Locale }) => {
    const pathname = usePathname();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);

    // Replace emojis with flag PNGs (stored in /public/flags/)  /images/chempol-ar.png
    const languages = [
        { code: 'en', label: 'English', flag: '/images/gb.svg' },
        { code: 'ar', label: 'العربية', flag: '/images/sa.svg' },
        { code: 'es', label: 'Español', flag: '/images/es.svg' },
    ];

    const currentLocale = ['en', 'ar', 'es'].includes(Locale) ? Locale : 'en';
    const selectedLang = languages.find(l => l.code === currentLocale) || languages[0];

    const handleSelect = (langCode) => {
        setIsOpen(false);

        if (!pathname) {
            router.push(`/${langCode}`);
            return;
        }

        const segments = pathname.split('/');
        segments[1] = langCode; // replace locale
        const newPath = segments.join('/');
        router.push(newPath);
    };

    return (
        <div className="relative inline-block text-left z-[100] font-sans">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex justify-center items-center shadow-md border border-textBlue rounded-sm text-sm px-3 py-2 text-textBlue hover:text-lightColorHover rtl:ml-3"
            >
                <img
                    src={selectedLang.flag}
                    alt={selectedLang.label}
                    width={30}
                    height={20}
                    className="mr-2 rtl:pl-1.5"
                />
                {selectedLang.label}
            </button>

            {isOpen && (
                <div className="absolute ltr:left-0 rtl:right-0   mt-2 w-44 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-[9999]">
                    <div className="py-1">
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => handleSelect(lang.code)}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-100"
                            >
                                <img
                                    src={lang.flag}
                                    alt={lang.label}
                                    width={30}
                                    height={20}
                                    className="mr-2 rtl:pl-1.5"
                                />
                                {lang.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LangSwitcher;

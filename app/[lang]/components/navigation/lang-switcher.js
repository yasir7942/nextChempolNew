'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';


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
        <div className="relative inline-block text-start z-[100] font-sans">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                aria-haspopup="true"
                aria-expanded={isOpen}
                className="inline-flex h-9 items-center gap-2 rounded-md border border-[#B9CBDB] bg-white px-2.5 text-sm text-textBlue transition-colors hover:border-textBlue focus:outline-none focus-visible:ring-2 focus-visible:ring-textBlue"
            >
                <img src={selectedLang.flag} alt="" width={22} height={16} className="h-4 w-[22px] shrink-0 rounded-[2px] object-cover" />
                {selectedLang.label}
                <ChevronDown aria-hidden="true" size={14} className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute start-0 mt-2 w-44 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-[9999]">
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

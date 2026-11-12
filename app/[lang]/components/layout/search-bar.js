"use client";

// Product search box (top bar and category pages). Suggestions come from
// /api/products/search, which matches every language and returns the products
// in the page language, so "rust inhibitor" also works on /ar/ and "مضاد الصدأ" on /en/.

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { useState, useRef, useEffect } from "react";
import { getImageUrl } from "@/libs/helper";
import { LineWave } from "react-loader-spinner";
import { Search } from "lucide-react";

const MIN_QUERY_LENGTH = 2;

const SearchBar = ({ locale, dictionary, topBar = false }) => {
  const router = useRouter();
  const [productData, setProductData] = useState([]);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchedQuery, setSearchedQuery] = useState(""); // the query productData belongs to
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const searchContainerRef = useRef(null);
  const inputRef = useRef(null);
  const resultsCache = useRef(new Map()); // query -> results, for this page visit
  const requestRef = useRef(null); // the request in flight, cancelled when a newer one starts
  const warmedRef = useRef(false);

  // First focus: let the server load the product index before the first letters arrive
  const handleFocus = () => {
    setIsSearchVisible(true);
    if (warmedRef.current) return;
    warmedRef.current = true;
    fetch(`/api/products/search?lang=${locale}`).catch(() => { });
  };

  const searchPageUrl = (query) => `/${locale}/search/?s=${encodeURIComponent(query)}`;
  const productUrl = (product) => `/${locale}/product/${product.slug}/`;

  const showResults = (query, data) => {
    setProductData(data);
    setSearchedQuery(query);
    setActiveIndex(-1);
    setIsSearchVisible(true);
  };

  const handleSearchQuery = async (query) => {
    const cleanQuery = query.trim();
    const cacheKey = cleanQuery.toLowerCase();

    requestRef.current?.abort();

    if (cleanQuery.length < MIN_QUERY_LENGTH) {
      setProductData([]);
      setSearchedQuery("");
      setIsLoading(false);
      return;
    }

    if (resultsCache.current.has(cacheKey)) {
      setIsLoading(false);
      showResults(cleanQuery, resultsCache.current.get(cacheKey));
      return;
    }

    const controller = new AbortController();
    requestRef.current = controller;
    setIsLoading(true);

    try {
      const res = await fetch(
        `/api/products/search?lang=${locale}&q=${encodeURIComponent(cleanQuery)}`,
        { signal: controller.signal }
      );
      const result = await res.json();

      if (!res.ok || !result?.ok) {
        throw new Error(result?.error || "Failed to fetch search results.");
      }

      const data = Array.isArray(result.data) ? result.data : [];
      resultsCache.current.set(cacheKey, data);
      showResults(cleanQuery, data);
    } catch (error) {
      if (error.name === "AbortError") return; // a newer search replaced this one
      console.error("Error fetching search results:", error);
      setProductData([]);
      setSearchedQuery("");
    } finally {
      if (requestRef.current === controller) setIsLoading(false);
    }
  };

  const handleSearch = useDebouncedCallback(handleSearchQuery, 200);

  const handleChange = (e) => {
    setSearchQuery(e.target.value);
    handleSearch(e.target.value);
  };

  const closeResults = () => {
    setIsSearchVisible(false);
    setActiveIndex(-1);
  };

  const clearSearch = (e) => {
    e.preventDefault();
    handleSearch.cancel();
    requestRef.current?.abort();

    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.focus();
    }

    setSearchQuery("");
    setSearchedQuery("");
    setProductData([]);
    closeResults();
    setIsLoading(false);
  };

  // Enter opens the highlighted product, otherwise the full results page
  const handleSubmit = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();

    if (activeIndex >= 0 && productData[activeIndex]) {
      router.push(productUrl(productData[activeIndex]));
    } else if (query) {
      router.push(searchPageUrl(query));
    } else {
      return;
    }

    closeResults();
    inputRef.current?.blur();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      closeResults();
      return;
    }

    if (!productData.length || (e.key !== "ArrowDown" && e.key !== "ArrowUp")) return;

    e.preventDefault();
    setIsSearchVisible(true);
    setActiveIndex((current) => {
      if (e.key === "ArrowDown") return current + 1 >= productData.length ? 0 : current + 1;
      return current <= 0 ? productData.length - 1 : current - 1;
    });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        closeResults();
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
      requestRef.current?.abort();
    };
  }, []);

  const hasQuery = searchedQuery.length >= MIN_QUERY_LENGTH && searchQuery.trim().length >= MIN_QUERY_LENGTH;
  // keep the previous results on screen while the next ones load, so the list does not flicker
  const showPanel = isSearchVisible && hasQuery && (productData.length > 0 || !isLoading);

  return (
    <div
      className={`flex flex-col relative z-[100] w-full text-gray-800 ${topBar ? "justify-center" : "p-4 md:p-6 text-center justify-center"}`}
      ref={searchContainerRef}
    >
      <form
        role="search"
        onSubmit={handleSubmit}
        className={`flex item bg-center w-full gap-2 font-light text-gray-900 ${topBar ? "relative" : ""}`}
      >
        {/* decorative magnifier: not clickable, there is no search button */}
        {topBar && (
          <Search aria-hidden="true" size={20} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-slate-500" />
        )}
        <input
          type="search"
          placeholder={topBar ? dictionary.topbar.searchPlaceholder || dictionary.topbar.searchProducts : dictionary.topbar.searchProducts}
          aria-label={dictionary.topbar.searchProducts}
          name="searchbar"
          autoComplete="off"
          enterKeyHint="search"
          ref={inputRef}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          className={`${topBar
            ? "h-11 rounded-md border border-[#B9CBDB] bg-white ps-10 pe-10 text-gray-800 placeholder:text-slate-500 transition-shadow focus:border-textBlue focus:ring-2 focus:ring-textBlue/30"
            : "border border-gray-500 px-5 py-2 bg-transparent border-solid"
            } w-full text-base outline-none [&::-webkit-search-cancel-button]:hidden`}
        />

        {isLoading && topBar && (
          <div aria-hidden="true" className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-textBlue border-t-transparent" />
        )}

        {isLoading && !topBar && (
          <div className="right-24 md:right-32 rtl:right-auto rtl:left-24 rtl:md:left-32 -top-4 absolute p-0 m-0 pointer-events-none">
            <LineWave
              visible={true}
              height="100"
              width="90"
              color="#0A6FB1"
              ariaLabel="loading...."
            />
          </div>
        )}

        {!topBar && (
          <button
            type="button"
            onClick={clearSearch}
            className="px-5 py-2 whitespace-nowrap bg-white border text-gray-800 border-gray-500 border-solid"
          >
            {dictionary.topbar.clear}
          </button>
        )}
      </form>

      <div
        className={`${showPanel ? "" : "hidden"} ${topBar
          ? "absolute start-0 end-0 top-full z-40 mt-1.5 overflow-hidden rounded-lg border border-[#CFDCE8] bg-white text-start shadow-lg"
          : "w-[89%] text-start h-auto absolute top-[67px] z-40 start-5 bg-gray-50 backdrop-blur-md bg-opacity-80 border border-1 border-gray-500 mt-1 p-5"}`}
      >
        {productData.length > 0 ? (
          <ul className={topBar ? "max-h-[min(60vh,28rem)] overflow-y-auto" : "flex flex-col space-y-2 max-h-[60vh] overflow-y-auto"}>
            {productData.map((product, index) => {
              const productImage =
                product?.productImage?.formats?.thumbnail?.url ||
                product?.productImage?.url ||
                "";
              const productTitle = product?.title || "";
              const categoryTitle = product?.product_categories?.[0]?.title || "";
              const isActive = index === activeIndex;

              return (
                <li key={product.documentId || product.id} className={topBar ? "border-b border-[#E3ECF4] last:border-b-0" : "flex flex-col space-y-3"}>
                  <Link
                    href={productUrl(product)}
                    onClick={closeResults}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={topBar
                      ? `flex min-h-[44px] items-center gap-3 px-4 py-2.5 text-[#0F2A4A] ${isActive ? "bg-[#EAF3FB]" : "hover:bg-[#EAF3FB]"}`
                      : `flex justify-start gap-5 items-center ps-1 py-1 ${isActive ? "bg-slate-200" : ""}`}
                  >
                    {productImage ? (
                      <Image
                        src={getImageUrl(productImage)}
                        className={topBar ? "h-10 w-10 shrink-0 object-contain" : "items-center w-9 shrink-0"}
                        width={100}
                        height={100}
                        alt={product?.productImage?.alternativeText || productTitle}
                      />
                    ) : (
                      <div className="w-9 h-9 shrink-0 bg-gray-200 border border-gray-300"></div>
                    )}

                    {topBar ? (
                      <div className="min-w-0">
                        <div className="break-words text-sm font-medium leading-snug">{productTitle}</div>
                        {categoryTitle && <div className="break-words text-xs text-slate-500">{categoryTitle}</div>}
                      </div>
                    ) : (
                      <div className="font-normal text-sm text-black tracking-widest">
                        {categoryTitle ? `${categoryTitle}: ` : ""}
                        {productTitle}
                      </div>
                    )}
                  </Link>

                  {!topBar && index !== productData.length - 1 && (
                    <div className="w-full h-[1px] border border-b border-gray-400"></div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className={topBar ? "px-4 py-3 text-sm text-slate-600" : "text-sm text-gray-700"}>{dictionary.topbar.noResults}</p>
        )}

        {productData.length > 0 && (
          <Link
            href={searchPageUrl(searchedQuery)}
            onClick={closeResults}
            className={topBar
              ? "block w-full border-t border-[#E3ECF4] bg-[#F1F6FA] px-4 py-3 text-center text-sm font-medium text-textBlue hover:bg-[#EAF3FB] first-letter:uppercase"
              : "w-full block h-auto mt-5 py-1 text-base bg-slate-200 font-normal tracking-wider text-center text-black first-letter:uppercase"}
          >
            {dictionary.topbar.viewMoreSearch}
          </Link>
        )}
      </div>
    </div>
  );
};

export default SearchBar;

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
      className="flex flex-col relative z-[100] w-full p-4 md:p-6 text-gray-800 text-center justify-center"
      ref={searchContainerRef}
    >
      <form
        role="search"
        onSubmit={handleSubmit}
        className="flex item bg-center w-full gap-2 font-light text-gray-900"
      >
        <input
          type="search"
          placeholder={dictionary.topbar.searchProducts}
          aria-label={dictionary.topbar.searchProducts}
          name="searchbar"
          autoComplete="off"
          enterKeyHint="search"
          ref={inputRef}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          className={`${topBar
            ? " border-b border-l border-gray-300 rtl:border-l-0 rtl:border-r "
            : " border border-gray-500"
            } w-full px-5 py-2 text-gray-800 text-base bg-transparent outline-none border-solid [&::-webkit-search-cancel-button]:hidden`}
        />

        {isLoading && (
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
        className={`${showPanel ? "" : "hidden"} w-[89%] text-start h-auto absolute top-[67px] z-40 start-5 bg-gray-50 backdrop-blur-md bg-opacity-80 border border-1 border-gray-500 mt-1 p-5`}
      >
        {productData.length > 0 ? (
          <ul className="flex flex-col space-y-2 max-h-[60vh] overflow-y-auto">
            {productData.map((product, index) => {
              const productImage =
                product?.productImage?.formats?.thumbnail?.url ||
                product?.productImage?.url ||
                "";
              const productTitle = product?.title || "";
              const categoryTitle = product?.product_categories?.[0]?.title || "";
              const isActive = index === activeIndex;

              return (
                <li key={product.documentId || product.id} className="flex flex-col space-y-3">
                  <Link
                    href={productUrl(product)}
                    onClick={closeResults}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={`flex justify-start gap-5 items-center ps-1 py-1 ${isActive ? "bg-slate-200" : ""}`}
                  >
                    {productImage ? (
                      <Image
                        src={getImageUrl(productImage)}
                        className="items-center w-9 shrink-0"
                        width={100}
                        height={100}
                        alt={product?.productImage?.alternativeText || productTitle}
                      />
                    ) : (
                      <div className="w-9 h-9 shrink-0 bg-gray-200 border border-gray-300"></div>
                    )}

                    <div className="font-normal text-sm text-black tracking-widest">
                      {categoryTitle ? `${categoryTitle}: ` : ""}
                      {productTitle}
                    </div>
                  </Link>

                  {index !== productData.length - 1 && (
                    <div className="w-full h-[1px] border border-b border-gray-400"></div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-gray-700">{dictionary.topbar.noResults}</p>
        )}

        {productData.length > 0 && (
          <Link
            href={searchPageUrl(searchedQuery)}
            onClick={closeResults}
            className="w-full block h-auto mt-5 py-1 text-base bg-slate-200 font-normal tracking-wider text-center text-black first-letter:uppercase"
          >
            {dictionary.topbar.viewMoreSearch}
          </Link>
        )}
      </div>
    </div>
  );
};

export default SearchBar;

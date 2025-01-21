"use client";

import { geProductsBySearch } from "@/app/data/loader";
import Image from "next/image";
import Link from "next/link";
import { useDebouncedCallback } from "use-debounce";
import { useState, useRef, useEffect } from 'react';
import { getImageUrl } from "@/libs/helper";
import { LineWave } from 'react-loader-spinner';





const SearchBar = ({ dataType, topBar = false }) => {

  const [productData, setProductData] = useState([]);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const searchContainerRef = useRef(null);
  const inputRef = useRef(null);

  const handleSearchQuery = async (query) => {
    const encodedString = encodeURIComponent(query);


    setSearchQuery(encodedString);




    if (query.length > 2) {
      setIsLoading(true); // Set loading to true
      try {


        const result = await geProductsBySearch(query);
        setProductData(result.data);
        console.log("****************serech****result***data*****************");
        console.log(result.data);

      } catch (error) {
        console.error('Error fetching search results:', error);
      } finally {
        setIsLoading(false); // Set loading to false after data fetching completes
      }
    } else {
      setProductData([]);
      setIsLoading(false); // Ensure loading is false if query length is not enough
    }
  };

  const handleSearch = useDebouncedCallback((term) => {
    console.log(`Searching... ${term}`);
    handleSearchQuery(term);
  }, 300);

  const clearSearch = (e) => {
    e.preventDefault();
    inputRef.current.value = '';
    setProductData([]);
    setIsSearchVisible(false);
  };

  const handleClickOutside = (event) => {
    if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
      setIsSearchVisible(false);
    }
  };

  const handleInputClick = () => {
    setIsSearchVisible(true);
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  return (
    <div className="flex flex-col relative z-[100] w-full p-4 md:p-6 text-gray-800 text-center justify-center" ref={searchContainerRef}>
      <form className="flex item bg-center w-full gap-2 font-light  text-gray-900">
        <input
          placeholder={'Search  ' + dataType}
          name="searchbar"
          ref={inputRef}
          onChange={(e) => handleSearch(e.target.value)}
          onClick={handleInputClick}
          className={`${topBar ? ' border-b border-l border-gray-300' : ' border border-gray-500'} w-full px-5 py-2 text-gray-800 text-base bg-transparent outline-none   border-solid `}
        />

        {/* isLoading */}
        {isLoading ? (
          <div className=" right-24 md:right-32 -top-4 absolute p-0 m-0">

            <LineWave
              visible={true}
              height="100"
              width="90"
              color="#0A6FB1"
              ariaLabel="loading...."
              wrapperStyle={{}}
              wrapperClass=""
            /* firstLineColor="#D11F24"
             middleLineColor="#939293"
             lastLineColor="#0A6FB1"  */
            />

          </div>
        ) : (<span></span>)}

        {!topBar ? (
          <button onClick={clearSearch} className="px-5 py-2 whitespace-nowrap bg-white border text-gray-800 border-gray-500 border-solid">
            Clear
          </button>
        ) : (<span></span>)}



      </form>



      <div className={`${productData.length <= 0 || !isSearchVisible ? 'hidden' : ''} w-[89%] text-left h-auto absolute top-[67px] z-40 
      left-5 bg-gray-50 backdrop-blur-md bg-opacity-80 border border-1 border-gray-700 mt-1 p-5`}>
        <div className="flex flex-col space-y-2 " >
          {productData.length > 0 ? (
            productData?.map((product, index) => (
              <div key={product.id} className="flex flex-col space-y-3 ">
                <div className="flex justify-start space-x-5 items-center pl-1">
                  <Link href={`/product/${product.slug}`}>
                    <Image
                      src={getImageUrl(product?.productImage?.formats?.thumbnail.url)}
                      className="items-center w-9"
                      width={100}
                      height={100}
                      alt={product?.productImage?.alternativeText ?? product.title}
                    />
                  </Link>
                  <Link href={`/product/${product.slug}`} className="flex flex-col items-start space-y-2">
                    <div className="font-normal text-sm text-black tracking-widest">
                      {product.product_categories[0]?.title}: {product.title}
                    </div>

                  </Link>
                </div>
                {index !== productData.length - 1 && (
                  <div className="w-full h-[1px] border border-b border-gray-400"></div>
                )}

              </div>

            ))
          ) : (
            ""
          )}
        </div>

        <Link href={`/search?s=${(searchQuery)}`} className="w-full block h-auto mt-5 py-1 text-base bg-slate-200 
        font-normal tracking-wider text-center text-black   first-letter:uppercase">View More Search Results</Link>
      </div>
    </div>
  );
};

export default SearchBar;

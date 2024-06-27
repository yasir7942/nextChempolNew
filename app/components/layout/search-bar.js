"use client";
import { geProductsBySearch } from "@/app/data/loader";
import Image from "next/image";
import Link from "next/link";
import { useDebouncedCallback } from "use-debounce"; 
import { useState, useRef, useEffect } from 'react';
import { getImageUrl } from "@/libs/helper";

const SearchBar = ({ dataType }) => {
  const [productData, setProductData] = useState([]);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const searchContainerRef = useRef(null);
  const inputRef = useRef(null);

  const handleSearchQuery = async (query) => {
    if (query.length > 2) {
      try {


        const result = await geProductsBySearch(query);
        setProductData(result.data);
       // console.log("****************serech****result***data*****************");
       // console.log(result.data);
        
      } catch (error) {
        console.error('Error fetching search results:', error);
      }
    } else {
      setProductData([]);
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
    <div className="flex flex-col relative w-full p-6 text-white text-center justify-center" ref={searchContainerRef}>
      <form className="flex item bg-center w-full gap-2 font-light text-gray-900">
        <input 
          placeholder={'Search  ' + dataType} 
          name="searchbar" 
          ref={inputRef} 
          onChange={(e) => handleSearch(e.target.value)} 
          onClick={handleInputClick} 
          className="w-full px-5 py-2 text-white text-base bg-transparent outline-none border border-gray-300 border-solid" 
        />
        <button onClick={clearSearch} className="px-5 py-2 whitespace-nowrap bg-white border border-gray-300 border-solid">
          Clear
        </button>
      </form>

      <div className={`${productData.length <= 0 || !isSearchVisible ? 'hidden' : ''} w-[89%] text-left h-auto absolute top-[67px] z-40 left-5 bg-gray-500 backdrop-blur-md bg-opacity-50 border border-1 border-gray-700 mt-1 p-5`}>
        <div className="flex flex-col space-y-2">
          {productData.length > 0 ? (
            productData.map((product, index) => (
              <div key={product.id} className="flex flex-col space-y-3">
                <div className="flex justify-start space-x-5 items-center pl-1">
                  <Link href={`/product/${product.slug}`}>
                    <Image
                      src={getImageUrl(product?.productImage.url)}
                      className="items-center w-9"
                      width={100}
                      height={100}
                      alt="Product image"
                    />
                  </Link>
                  <Link href={`/product/${product.slug}`} className="flex flex-col items-start space-y-2">
                    <div className="font-light text-sm text-gray-200 tracking-widest">
                      {product.product_categories.data[0]?.title}: {product.title}
                    </div>
                    <div className="flex text-darkYellow justify-center items-center text-center font-light text-sm space-x-2">
                      <div>{product.grade}</div>
                      <div>{product.api}</div>
                      <div>{product.acea}</div>
                    </div>
                  </Link>
                </div>
                {index !== productData.length - 1 && (
                  <div className="w-full h-[1px] border border-b border-gray-500"></div>
                )}
              </div>
            ))
          ) : (
            ""
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchBar;

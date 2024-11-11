"use client";

import { gePostBySearch } from "@/app/data/loader";
import Image from "next/image";
import Link from "next/link";
import { useDebouncedCallback } from "use-debounce";
import { useState, useRef, useEffect } from 'react';
import { getImageUrl } from "@/libs/helper";
import { LineWave } from 'react-loader-spinner';



const SearchBarForPost = () => {
  const [postData, setPostData] = useState([]);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchContainerRef = useRef(null);
  const inputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearchQuery = async (query) => {
    console.log(`Searching... ${query}`);
    const encodedString = encodeURIComponent(query);
    setSearchQuery(encodedString);
    if (query.length > 2) {
      setIsLoading(true); // Set loading to true
      try {


        const result = await gePostBySearch(query);
        setPostData(result.data);
        console.log("****************serech****result***data*****************");
        console.dir(result, { depth: null });

      } catch (error) {
        console.error('Error fetching search results:', error);
      }
      finally {
        setIsLoading(false); // Set loading to false after data fetching completes
      }
    } else {
      setPostData([]);
      setIsLoading(false); // Ensure loading is false if query length is not enough
    }
  };

  const handleSearch = useDebouncedCallback((term) => {

    handleSearchQuery(term);
  }, 300);

  const clearSearch = (e) => {
    e.preventDefault();
    inputRef.current.value = '';
    setPostData([]);
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
    <div className="flex flex-col relative w-full  py-8 text-white text-center justify-center" ref={searchContainerRef}>
      <form className="flex item bg-center w-full gap-2 font-light text-gray-900">
        <input
          placeholder={'Search  Post'}
          name="searchbar"
          ref={inputRef}
          onChange={(e) => handleSearch(e.target.value)}
          onClick={handleInputClick}
          className="w-full px-5 py-2 text-gray-800 text-base bg-transparent outline-none border border-gray-400 border-solid"
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


        <button onClick={clearSearch} className="px-5 py-2 whitespace-nowrap text-gray-700 font-normal bg-white border  border-gray-600 border-solid">
          Clear
        </button>
      </form>

      <div className={`${postData.length <= 0 || !isSearchVisible ? 'hidden' : ''} w-[90%] text-left h-auto absolute top-[67px] z-40 left-5 bg-gray-100 backdrop-blur-md bg-opacity-80 border border-1 border-gray-700 mt-1 p-5`}>
        <div className="flex flex-col space-y-2 " >
          {postData.length > 0 ? (
            postData.map((post, index) => (
              <div key={post.id} className="flex flex-col space-y-3 ">
                <div className="flex justify-start space-x-5 items-center pl-1">
                  <Link href={`/post/${post.slug}`}>
                    <Image
                      src={getImageUrl(post?.featureImage.formats.thumbnail.url)}
                      className="items-center w-44"
                      width={400}
                      height={400}
                      alt={post?.featureImage.alternativeText ?? post.title}
                    />
                  </Link>
                  <Link href={`/blog/${post.slug}`} className="flex flex-col items-start space-y-2">
                    <div className="  text-base font-normal    text-gray-900">
                      {post.title}
                    </div>
                    <div className="flex text-gray-700  justify-center items-center text-left font-light text-base space-x-2">
                      <div>{post.seo?.seoDesctiption}</div>
                    </div>
                  </Link>
                </div>
                {index !== postData.length - 1 && (
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

export default SearchBarForPost;

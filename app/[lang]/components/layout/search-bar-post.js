"use client";

import Image from "next/image";
import Link from "next/link";
import { useDebouncedCallback } from "use-debounce";
import { useState, useRef, useEffect } from "react";
import { getImageUrl } from "@/libs/helper";
import { LineWave } from "react-loader-spinner";

const SearchBarForPost = ({ locale, dictionary }) => {
  const [postData, setPostData] = useState([]);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const searchContainerRef = useRef(null);
  const inputRef = useRef(null);

  const handleSearchQuery = async (query) => {
    const cleanQuery = query.trim();
    const encodedString = encodeURIComponent(cleanQuery);

    setSearchQuery(encodedString);

    if (cleanQuery.length > 2) {
      setIsLoading(true);

      try {
        const res = await fetch(
          `/api/posts/search/?lang=${encodeURIComponent(locale)}&q=${encodedString}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const result = await res.json();

        if (!res.ok || !result?.ok) {
          throw new Error(result?.error || "Failed to fetch search results.");
        }

        setPostData(Array.isArray(result.data) ? result.data : []);
        setIsSearchVisible(true);
      } catch (error) {
        console.error("Error fetching search results:", error);
        setPostData([]);
      } finally {
        setIsLoading(false);
      }
    } else {
      setPostData([]);
      setIsLoading(false);
    }
  };

  const handleSearch = useDebouncedCallback((term) => {
    handleSearchQuery(term);
  }, 300);

  const clearSearch = (e) => {
    e.preventDefault();

    if (inputRef.current) {
      inputRef.current.value = "";
    }

    setSearchQuery("");
    setPostData([]);
    setIsSearchVisible(false);
    setIsLoading(false);
  };

  const handleClickOutside = (event) => {
    if (
      searchContainerRef.current &&
      !searchContainerRef.current.contains(event.target)
    ) {
      setIsSearchVisible(false);
    }
  };

  const handleInputClick = () => {
    setIsSearchVisible(true);
  };

  useEffect(() => {
    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  return (
    <div
      className="flex flex-col relative z-[100] w-full p-2 md:p-6 text-gray-800 text-center justify-center"
      ref={searchContainerRef}
    >
      <form className="flex item bg-center w-full gap-2 font-light text-gray-900">
        <input
          placeholder={dictionary.topbar.searchBlogs}
          name="searchbar"
          ref={inputRef}
          onChange={(e) => handleSearch(e.target.value)}
          onClick={handleInputClick}
          className="w-full px-5 py-2 text-gray-800 text-base bg-transparent outline-none border border-gray-500 border-solid"
        />

        {isLoading ? (
          <div className="right-24 md:right-32 -top-4 absolute p-0 m-0">
            <LineWave
              visible={true}
              height="100"
              width="90"
              color="#0A6FB1"
              ariaLabel="loading...."
              wrapperStyle={{}}
              wrapperClass=""
            />
          </div>
        ) : (
          <span></span>
        )}

        <button
          onClick={clearSearch}
          className="px-5 py-2 whitespace-nowrap bg-white border text-gray-800 border-gray-500 border-solid"
        >
          {dictionary.topbar.clear}
        </button>
      </form>

      <div
        className={`${postData.length <= 0 || !isSearchVisible ? "hidden" : ""
          } w-[89%] text-left h-auto absolute top-[67px] z-40 left-5 bg-gray-50 backdrop-blur-md bg-opacity-80 border border-1 border-gray-700 mt-1 p-5`}
      >
        <div className="flex flex-col space-y-2">
          {postData.length > 0
            ? postData.map((post, index) => {
              const postImage =
                post?.featureImage?.formats?.thumbnail?.url ||
                post?.featureImage?.url ||
                "";

              const postTitle = post?.title || "";
              const postSlug = post?.slug || "";
              const postDate = post?.PostDate || "";
              const seoDescription = post?.seo?.seoDesctiption || "";

              const shortDescription =
                seoDescription.split(" ").length > 25
                  ? seoDescription.split(" ").slice(0, 25).join(" ") + "..."
                  : seoDescription;

              return (
                <div key={post.id} className="flex flex-col space-y-3">
                  <div className="flex justify-start space-x-5 items-center pl-1">
                    <Link
                      href={`/${locale}/blog/${postSlug}`}
                      onClick={() => {
                        setTimeout(() => {
                          setIsSearchVisible(false);
                        }, 1000);
                      }}
                    >
                      {postImage ? (
                        <Image
                          src={getImageUrl(postImage)}
                          className="items-center w-16"
                          width={100}
                          height={100}
                          alt={
                            post?.featureImage?.alternativeText ||
                            postTitle
                          }
                        />
                      ) : (
                        <div className="w-16 h-12 bg-gray-200 border border-gray-300"></div>
                      )}
                    </Link>

                    <Link
                      href={`/${locale}/blog/${postSlug}`}
                      className="flex flex-col items-start space-y-2"
                      onClick={() => {
                        setTimeout(() => {
                          setIsSearchVisible(false);
                        }, 1000);
                      }}
                    >
                      <div className="font-normal text-sm text-black tracking-widest">
                        {postTitle}
                      </div>

                      <div className="font-light text-xs text-black">
                        {postDate}
                        {postDate && shortDescription ? " : " : ""}
                        {shortDescription}
                      </div>
                    </Link>
                  </div>

                  {index !== postData.length - 1 && (
                    <div className="w-full h-[1px] border border-b border-gray-400"></div>
                  )}
                </div>
              );
            })
            : ""}
        </div>

        <Link
          href={`/${locale}/search?s=${searchQuery}`}
          className="hidden w-full h-auto mt-5 py-1 text-base bg-slate-200 font-normal tracking-wider text-center text-black first-letter:uppercase"
        >
          View More Search Results
        </Link>
      </div>
    </div>
  );
};

export default SearchBarForPost;
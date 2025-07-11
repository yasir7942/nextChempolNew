"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { useRef } from "react";



export function SearchComponenet() {


  const inputRef = useRef(null);
  const searchParams = useSearchParams();
  const { replace } = useRouter();
  const pathname = usePathname();



  const handleSearch = useDebouncedCallback((term) => {
    // console.log(`Searching... ${term}`);
    const params = new URLSearchParams(searchParams);
    //  params.set("page", "1");

    if (term) {
      params.set("s", term);
    } else {
      params.delete("s");
    }

    replace(`${pathname}?${params.toString()}`);
  }, 300);


  const clearSearch = (e) => {
    e.preventDefault();
    //console.log("calllllllllllllllllllllll");
    const params = new URLSearchParams(searchParams);
    params.delete("s");
    if (inputRef.current) {
      inputRef.current.value = ""; // Clear the input field using the ref
    }
    replace(`${pathname}?${params.toString()}`);
  };







  return (
    <div>

      <div className="flex item bg-center w-full gap-2 font-light text-gray-900">
        <input
          placeholder={'Search'}
          name="searchbar"
          ref={inputRef}
          onChange={(e) => handleSearch(e.target.value)}
          defaultValue={searchParams.get("s")?.toString()}
          className="w-full px-5 py-2 text-gray-700 text-base bg-transparent outline-none border border-gray-300 border-solid"
        />
        <button onClick={clearSearch} className="px-5 py-2 whitespace-nowrap bg-white border border-gray-300 border-solid">
          Clear
        </button>
      </div>

    </div>


  )
};

export default SearchComponenet





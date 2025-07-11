"use client"


import { useState, useEffect } from 'react';

const ScreenWidth = () => {
    const [screenWidth, setScreenWidth] = useState(0);

    useEffect(() => {
        // Function to update screen width
        const updateWidth = () => {
            setScreenWidth(window.innerWidth);
        };

        // Set initial width
        updateWidth();

        // Add event listener on window resize
        window.addEventListener('resize', updateWidth);

        // Cleanup event listener on unmount
        return () => window.removeEventListener('resize', updateWidth);
    }, []);

    return (
        <div className="h-40 w-full flex flex-col text-center  justify-center  bg-gray-200">

            <p className="text-lg font-bold bg-blue-500 text-white p-4 ">
                Your screen width is: {screenWidth}px
            </p>


            <div class="text-center">
                <p class="hidden sm:block md:hidden bg-blue-500 text-white p-4 ">
                    I am on <strong>SMALL</strong> screen size (≥640px)
                </p>
                <p class="hidden md:block lg:hidden bg-green-500 text-white p-4 ">
                    I am on <strong>MEDIUM</strong> screen size (≥768px)
                </p>
                <p class="hidden lg:block xl:hidden bg-yellow-500 text-white p-4 ">
                    I am on <strong>LARGE MD </strong> screen size (≥1024px)
                </p>
                <p class="hidden xl:block 2xl:hidden bg-red-500 text-white p-4 ">
                    I am on <strong>EXTRA LARGE XL</strong> screen size (≥1280px)
                </p>
                <p class="hidden 2xl:block bg-purple-500 text-white p-4 ">
                    I am on <strong>2XL</strong> screen size (≥1536px)
                </p>
            </div>



        </div>
    );
};

export default ScreenWidth;

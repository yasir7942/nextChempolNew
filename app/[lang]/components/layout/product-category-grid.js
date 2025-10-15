
import { getImageUrl } from "@/libs/helper";
import Image from "next/image"
import PaddingContainer from "./padding-container";
import { geProductCategoryLeftMenu } from "../../data/loader";
import { getDictionary } from "@/libs/getDictionary";
import Link from "next/link";



const ProductCategoryGrid = async ({ locale }) => {




  const dictionary = await getDictionary(locale);
  const categoryData = await geProductCategoryLeftMenu(locale);




  return (
    <div>

      {/* <!-- product categories--> */}

      <section className="flex flex-col  mt-10 items-center justify-center space-y-1 pt-10 pb-5   ">
        <PaddingContainer>
          <div className=" font-light  tracking-widest text-darkGary text-xl text-center uppercase" > {dictionary.homePage.categories}</div>
          <h2 id="our-products" className=" text-2xl md:text-3xl text-center font-semibold text-textBlue capitalize " >{dictionary.homePage.exploreOurProducts}</h2>
          <div className="text-center h-[2px] bg-blueOpecity  w-40" ></div>

          {/* <!--category grid--> */}
          <div className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-4  gap-4 pt-10 pb-10 ">



            {/*  {categoryData.data.map((category) => (


              <div key={category.id} className="flex flex-col space-y-1 text-center justify-center relative group rounded-lg" >
                <Link href={`/${locale}/product-category/${category.slug}/`}  >
                  <Image className="z-2 rounded-xl"
                    src={getImageUrl(category.image.url)}
                    width={500} height={300} alt={category.title} />
                </Link>
                <Link href={`/${locale}/product-category/${category.slug}/`} className="text-center rtl:text-right mt-2 transition duration-300 ease-in-out hover:text-textBlue text-base md:text-xl text-darkGary font-normal" >{category.title}</Link>
                <Link href={`/${locale}/product-category/${category.slug}/`} className="text-justify p-1  rtl:text-right  text-base  text-darkGary " >{category.shortDescription}</Link>

              </div>

            ))}  */}


            {categoryData.data.map((category) => (
              <div
                key={category.id}
                className="flex h-full flex-col mt-5 justify-start rounded-lg  text-center"
              >
                <Link href={`/${locale}/product-category/${category.slug}/`} className="block">
                  <Image
                    className="rounded-xl object-cover z-2"
                    src={getImageUrl(category.image.url)}
                    width={500}
                    height={300}
                    alt={category.title}
                  />
                </Link>

                {/* Title — reserve one line height */}
                <Link
                  href={`/${locale}/product-category/${category.slug}/`}
                  className="mt-2 line-clamp-1 text-center rtl:text-right text-base md:text-xl font-normal text-darkGary hover:text-textBlue transition duration-300 ease-in-out min-h-[1.75rem]"
                >
                  {category.title}
                </Link>

                {/* Description — clamp to 2 lines and reserve space */}
                <Link
                  href={`/${locale}/product-category/${category.slug}/`}
                  className="mt-1 text-left rtl:text-right text-sm leading-tight text-darkGary  min-h-[3.0rem]"
                >
                  {category.shortDescription ? category.shortDescription : ""}
                </Link>

                {/* This pushes any future footer/CTA to the bottom if you add one later */}
                <div className="mt-auto" />
              </div>
            ))}





          </div>
        </PaddingContainer>
      </section>

      {/* <!-- end product categories--> */}



    </div>
  )
}

export default ProductCategoryGrid

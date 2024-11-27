import { geProductCategoryLeftMenu } from "@/app/data/loader";
import { getImageUrl } from "@/libs/helper";
import Image from "next/image"
import PaddingContainer from "./padding-container";



const ProductCategoryGrid = async () => {

  const categoryData = await geProductCategoryLeftMenu();

  return (
    <div>

      {/* <!-- product categories--> */}

      <section className="flex flex-col  mt-10 items-center justify-center space-y-1 pt-10 pb-5   ">
        <PaddingContainer>
          <div className=" font-light  tracking-widest text-darkGary text-xl text-center uppercase" >Categories</div>
          <div className=" text-2xl md:text-3xl text-center font-semibold text-textBlue capitalize " >Explore Our Wide Range Of Products!</div>
          <div className="text-center h-[2px] bg-blueOpecity  w-40" ></div>

          {/* <!--category grid--> */}
          <div className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-4  gap-8 pt-10 pb-10 ">



            {categoryData.data.map((category) => (


              <div key={category.id} className="flex flex-col space-y-2 text-center justify-center relative group rounded-lg" >
                <a href={`/product-category/${category.slug}/`}  >
                  <Image className="z-2 rounded-xl"
                    src={getImageUrl(category.image.url)}
                    width={500} height={300} alt={category.title} />
                </a>
                <a href={`/product-category/${category.slug}/`} className="text-center transition duration-300 ease-in-out hover:text-textBlue text-xl text-darkGary font-normal" >{category.title}</a>
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

import { getImageUrl } from "@/libs/helper";
import Image from "next/image";

const GroupProducts = ({ productGroup }) => {
  return (
    <div className="w-full    text-black md:pl-8  "   >
      {productGroup && productGroup.data && productGroup.data.length > 0 && (
        <div className=" text-xl font-semibold mt-16   ">
          Related Products
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-5 md:gap-5 lg:gap-5 mb-14 justify-center items-center mt-10  ">
        {productGroup.data.map((product) => (
          <div
            key={product.id}
            className="flex flex-col w-full justify-center items-center space-y-0  "
          >
            <a href={`/product/${product.slug}`}>
              <Image
                className="w-36 object-contain"
                src={getImageUrl(product.productImage.url)}
                height={600}
                width={600}
                alt={product.title}
              />
            </a>
            <h2 className="capitalize text-base font-light text-black pt-3 leading-1 text-center">
              <a href={`/product/${product.slug}`}>{product.title}</a>
            </h2>
            <p className="text-gray-200 text-base xl:text-xl font-light text-center leading-5 uppercase">
              {product.grade}
            </p>
          </div>
        ))}
      </div>

    </div>
  );
};

export default GroupProducts;

import Image from "next/image";

const ProductSize = ({ packingSize }) => {
  const sizesArr = packingSize
    ? packingSize.split(',').map(item => parseFloat(item)).filter(Number.isFinite)
    : [];

  const getProductImage = (size) => {
    switch (size) {
      case 0.7:
        return "0.7L.png";
      case 1: 
          return "1L.png";
      case 2:
        return "2L.png";
      case 3:
        return "3L.png";
      case 4:
        return "4L.png";
      case 5:
         return "5L.png";
      case 20:
        return "20L.png";
      case 25:
          return "25L.png";
      case 200:
           return "200L.png";
      case 208:
        return "200L.png";
      default:
           return null; // Return null for sizes not covered
    }
  };

  return (
    <div>
      {sizesArr.length > 0 && (
        <div className="flex flex-col w-full h-auto">
          <div className="text-center uppercase mt-10 text-gray-300">Size Available</div>
          <div className="flex justify-center items-center mt-5 space-x-1">
          {sizesArr.map((size, index) => {

                const image = getProductImage(size);
                if (!image) return null; // Skip rendering if no valid image is returned


              return (
                <div key={index} className="flex flex-col justify-center items-center">
                  <div className="w-12 md:w-8 lg:w-8 h-auto ">
                    <Image  className="  h-14 w-auto"
                      src={`/images/packing/${image}`} 
                      width={150} 
                      height={150} 
                      alt={`product packing size ${size}`} 
                    />
                  </div>
                  <div className="text-center uppercase text-gray-300">{size}L</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductSize;

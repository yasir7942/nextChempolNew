import Image from "next/image"


const CharcoalContentBox = ({ title, description, image, url = "" }) => {
  return (
    <div>


      {/* <!--card--> */}
      <div className=" overflow-hidden   block rounded-lg    shadow-secondary-1 h-full  lg:flex-1 lg:max-w-md  ">
        <div
          className="relative overflow-hidden  bg-no-repeat"
          data-twe-ripple-init
          data-twe-ripple-color="light">
          <Image
            className="w-full"
            src={image}
            width={600}
            height={300}
            alt="" />
          <a href={`/${url}/`} >
            <div
              className="  absolute bottom-0 left-0 right-0 top-0 h-full w-full overflow-hidden bg-[hsla(0,0%,98%,0.15)] bg-fixed opacity-0 transition duration-300 ease-in-out hover:opacity-100"></div>
          </a>
        </div>
        <div className="p-6 text-surface bg-[#f2f2f2] text-white h-full ">
          <h5 className="mb-2 text-base font-medium text-textBlue uppercase leading-tight">{title}</h5>
          <p className="mb-4   text-sm font-normal  text-darkGary ">

            {description}


          </p>
          <a href={`/${url}/`} >  <button

            type="button"
            className="text-textBlue inline-block  pb-2 pt-2.5 text-xs font-medium uppercase"
            data-twe-ripple-init
            data-twe-ripple-color="light">
            Read More...
          </button>
          </a>
        </div>
      </div>
      {/* <!--end card--> */}


    </div>
  )
}

export default CharcoalContentBox

import { flattenAttributes } from "@/libs/data-utils";
import qs from 'qs';

let baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
let appMode = process.env.NEXT_PUBLIC_MODE;
let cacheSystem = "";
if (appMode == "dev") {
  cacheSystem = "no-cache";
}


export async function fetchData(path, filter) {

  const authToken = null;
  const headers =
  {
    method: "GET",
    header: {
      "Content-Type": "application-json",
      cache: cacheSystem,
      Authorization: `Bearer ${authToken}`,
    }

  }


  const url = new URL(path, baseUrl);
  url.search = filter;

  // show API links
  console.log(url.href);

  try {

    const response = await fetch(url.href, authToken ? headers : {});
    const data = await response.json();

    const flattenedData = flattenAttributes(data);
    // console.log(flattenedData)

    return flattenedData;
  } catch (error) {
    console.log(error);
  }
}


export async function getHomePage() {

  const blogBlockQuery = qs.stringify({

    populate: ['banner.webBanner', 'banner.mobileBanner', 'seo.schema'],

  });


  let homePage = await fetchData("home-page", blogBlockQuery);

  return homePage
}

export async function getPostPage() {

  const blogBlockQuery = qs.stringify({

    populate: ['banner.webBanner', 'banner.mobileBanner', 'seo.schema'],

  });


  let blogPage = await fetchData("blog-page", blogBlockQuery);

  return blogPage
}

export async function getSearchPage() {

  const blogBlockQuery = qs.stringify({

    populate: ['banner.webBanner', 'banner.mobileBanner', 'seo.schema'],

  });


  let searchPage = await fetchData("search-page", blogBlockQuery);

  return searchPage
}

export async function getPostLimitedData() {

  const blogBlockQuery = qs.stringify({
    sort: 'PostDate:desc',
    pagination: {
      page: 1,
      pageSize: 3
    },
    populate: ['seo', 'featureImage', 'seo.schema'],
  });

  return await fetchData("posts", blogBlockQuery);

}


export async function geProductCategoryLeftMenu() {

  const blogBlockQuery = qs.stringify({

    sort: ['index'],
    populate: ['products', 'seo.schema', 'image', 'bImage'],
  });
  return await fetchData("product-categories", blogBlockQuery);

}


export async function geProductsByCategory(category, currentPage, pageSize) {

  const PAGE_SIZE = pageSize;

  const blogBlockQuery = qs.stringify({

    filters: {
      product_categories: {
        slug: {
          $eq: category,
        },
      },
    },
    populate: ['productImage', 'product_categories', 'product_categories.banner.webBanner', 'product_categories.banner.mobileBanner', 'seo.schema'],


    pagination: {
      pageSize: PAGE_SIZE,
      page: currentPage,
    },

  });


  return await fetchData("products", blogBlockQuery);

}

export async function geGridCategoybyProduct() {

  const blogBlockQuery = qs.stringify({
    populate: ['banner.webBanner', 'banner.mobileBanner', 'seo.schema'],
  });


  return await fetchData("grid-category-page", blogBlockQuery);

}


export async function geSingleProduct(slug) {

  const blogBlockQuery = qs.stringify({
    filters: {

      slug: {
        $eq: slug, // Replace ' ' with the actual slug variable
      },

    },
    populate: ['productImage', 'seo', 'seo.schema', 'productSchema', 'productSchema.reviews',
      'related_products.productImage', 'product_categories',
      'TDSFile.url', 'MSDSFile.url'],
  });


  return await fetchData("products", blogBlockQuery);

}


export async function geProductsByGroup(productSlug, groupSlug) {

  const blogBlockQuery = qs.stringify({

    filters: {
      product_group: {
        slug: {
          $eq: groupSlug,
        },
      },
      $and: [
        {
          slug: {
            $ne: productSlug,
          },
        },
      ],


    },
    populate: ['productImage', 'seo.schema'],



    pagination: {
      pageSize: 20,
      page: 1,
    },

  });


  // 
  return await fetchData("products", blogBlockQuery);

}


export async function geProductsBySearch(query) {


  const searchProductQuery = qs.stringify({
    filters: {
      $or: [
        { title: { $containsi: query } },

        { product_categories: { title: { $containsi: query } } }
      ],
    },
    populate: ['productImage', 'product_categories', 'seo.schema'],
    pagination: {
      pageSize: 10,
      page: 1,
    },
  });

  return await fetchData("products", searchProductQuery);
}


export async function geProductsBySearchAdvance(query) {


  const searchProductQuery = qs.stringify({
    filters: {
      $or: [
        { title: { $containsi: query } }, // product_categories
        { product_categories: { title: { $containsi: query } } }
      ],
    },
    populate: ['productImage', 'product_categories', 'seo.schema'],
    pagination: {
      pageSize: 18,
      page: 1,
    },
  });

  return await fetchData("products", searchProductQuery);
}

export async function getBlogPage() {

  const blogBlockQuery = qs.stringify({

    populate: ['banner.webBanner', 'banner.mobileBanner', 'seo.schema'],

  });


  let blogPage = await fetchData("blog-page", blogBlockQuery);

  return blogPage
}

export async function gePosts(currentPage, pageSize) {

  const PAGE_SIZE = pageSize;
  const blogBlockQuery = qs.stringify({

    sort: 'PostDate:desc',
    filters: {},
    populate: ['featureImage', 'seo.schema'],


    pagination: {
      pageSize: PAGE_SIZE,
      page: currentPage,
    },

  });


  return await fetchData("posts", blogBlockQuery);

}


export async function geSinglePost(slug) {

  const blogBlockQuery = qs.stringify({
    filters: {

      slug: {
        $eq: slug,
      },

    },
    populate: ['featureImage', 'seo', 'seo.schema', 'post_categories'],
  });


  return await fetchData("posts", blogBlockQuery);

}



export async function getAboutPage() {

  const blogBlockQuery = qs.stringify({

    populate: ['aboutus.image', 'founder.image', 'overValues', 'coreValue.image', 'overVisson.image', 'ourMission.image', 'qualities', 'qualities.image', 'seo.schema'],

  });


  let aboutPage = await fetchData("about-us", blogBlockQuery);

  return aboutPage
}


export async function getLubricantAddtives() {

  const lubBlockQuery = qs.stringify({

    populate: ['text1', 'text2', 'textimage1', 'textimage1.image', 'whyUs', 'faq', 'seo', 'seo.schema'],

  });
  let lubricantAddtives = await fetchData("lubricant-additives-uae", lubBlockQuery);

  return lubricantAddtives
}


export async function getFaqPage() {

  const faqBlockQuery = qs.stringify({

    populate: ['faq', 'seo', 'seo.schema'],

  });
  let faqPage = await fetchData("faq-page", faqBlockQuery);

  return faqPage
}



export async function getContactUsPage() {

  const conatcBlockQuery = qs.stringify({
    populate: ['addressBook', 'seo', 'seo.schema'],

  });
  return await fetchData("contact-us", conatcBlockQuery);

}


export async function geAllProductsSlug() {

  const productBlockQuery = qs.stringify({

    fields: ['slug', 'updatedAt']

  });
  return await fetchData("products", productBlockQuery);

}

export async function geAllPostSlug() {

  const blogBlockQuery = qs.stringify({

    fields: ['slug', 'updatedAt']

  });
  return await fetchData("posts", blogBlockQuery);

}


export async function geAllProductCategorySlug() {

  const blogBlockQuery = qs.stringify({

    fields: "slug",

  });
  return await fetchData("product-categories", blogBlockQuery);

}


export async function getProductCategory(slug) {

  const blogBlockQuery = qs.stringify({
    filters: {

      slug: {
        $eq: slug,
      },
    },
    populate: ['banner', 'banner.webBanner', 'banner.mobileBanner', 'seo', 'seo.schema'],

  });
  return await fetchData("product-categories", blogBlockQuery);
}


export async function getProductCategoryList() {

  const blogBlockQuery = qs.stringify({
    filters: {
    },
    populate: ['products', 'products.productImage', 'products.TDSFile', 'products.MSDSFile'],

  });
  return await fetchData("product-categories", blogBlockQuery);
}


export async function getProductCategoryForHome() {

  const blogBlockQuery = qs.stringify({

    fields: ['title', 'slug'],
    sort: ['index'],

  });
  return await fetchData("product-categories", blogBlockQuery);
}


export async function gePostBySearch(query) {

  const searchPostQuery = qs.stringify({
    filters: {
      $or: [
        { title: { $containsi: query } },
        { post_categories: { title: { $containsi: query } } },
        { seo: { seoDesctiption: { $containsi: query } } }
      ],
    },
    populate: ['seo', 'featureImage', 'post_categories', 'seo.schema'],
    pagination: {
      pageSize: 10,
      page: 1,
    },
  });

  return await fetchData("posts", searchPostQuery);
}


export async function getCertifcateCategories() {

  const certificateBlockQuery = qs.stringify({

    populate: ['logo', 'certificates', 'certificates.certificateImages', 'certificates.certificatePdf', 'seo.schema'],
    pagination: {
      pageSize: 1000,
      page: 1,
    },

  });
  return await fetchData("certificate-categories  ", certificateBlockQuery);

}



export async function getCertificateApprovalPage() {

  const blogBlockQuery = qs.stringify({

    populate: ['banner.webBanner', 'banner.mobileBanner', 'seo', 'seo.schema'],

  });


  let approvalPage = await fetchData("certificate-and-approval", blogBlockQuery);

  return approvalPage
}


export async function geAllRedirectionUrl() {

  const UrllockQuery = qs.stringify({

    fields: ['soruce', 'destination']

  });
  return await fetchData("redirection-url", UrllockQuery);

}
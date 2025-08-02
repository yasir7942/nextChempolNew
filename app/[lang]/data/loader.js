import { flattenAttributes } from "@/libs/data-utils";
import { locale } from "moment";
import qs from 'qs';

let baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
let appMode = process.env.NEXT_PUBLIC_MODE;
let cacheSystem = "";
if (appMode == "dev") {
  cacheSystem = "no-cache";
}


export async function fetchData(path, filter) {

  const authToken = null;
  const header =
  {
    method: "GET",
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Content-Type": "application/json",
      "Strapi-Response-Format": "v4",
      Authorization: `Bearer ${authToken}`,
    },
    cache: cacheSystem,

  }





  const url = new URL(path, baseUrl);
  url.search = filter;

  // show API links
  // console.warn(url.href);

  try {

    const response = await fetch(url.href, authToken ? header : {});
    const data = await response.json();

    const flattenedData = flattenAttributes(data);
    //
    // console.log(flattenedData)

    return flattenedData;
  } catch (error) {
    console.log(error);
  }
}


export async function getHomePage(lang) {

  const blogBlockQuery = qs.stringify({
    locale: lang,
    populate: ['banner.webBanner', 'banner.mobileBanner', 'seo.schema'],

  });

  let homePage = await fetchData("home-page", blogBlockQuery);

  return homePage
}


export async function getVideosLimitedData() {

  const videoBlockQuery = qs.stringify({
    sort: 'youtubePublishedAt:desc',
    pagination: {
      page: 1,
      pageSize: 4
    },
    populate: ['image'],
  });

  return await fetchData("videos", videoBlockQuery);

}

export async function getPostPage() {

  const blogBlockQuery = qs.stringify({

    populate: ['banner.webBanner', 'banner.mobileBanner', 'seo.schema'],

  });


  let blogPage = await fetchData("blog-page", blogBlockQuery);

  return blogPage
}

export async function getSearchPage(lang) {

  const blogBlockQuery = qs.stringify({
    locale: lang,
    populate: ['banner.webBanner', 'banner.mobileBanner', 'seo.schema'],

  });


  let searchPage = await fetchData("search-page", blogBlockQuery);

  return searchPage
}

export async function getPostLimitedData(lang) {

  const blogBlockQuery = qs.stringify({
    locale: lang,
    sort: 'PostDate:desc',
    pagination: {
      page: 1,
      pageSize: 4
    },
    populate: ['seo', 'featureImage', 'seo.schema'],
  });

  return await fetchData("posts", blogBlockQuery);

}


export async function geProductCategoryLeftMenu(lang) {

  const blogBlockQuery = qs.stringify({
    locale: lang,
    sort: ['index'],
    populate: ['image', 'products', 'seo.schema'],
  });
  return await fetchData("product-categories", blogBlockQuery);

}


export async function getProductsByCategory(lang, category, currentPage, pageSize) {

  const PAGE_SIZE = pageSize;

  const blogBlockQuery = qs.stringify({
    locale: lang,
    filters: {
      product_categories: {
        slug: {
          $eq: category,
        },
      },
    },
    populate: ['productImage', 'product_categories', 'product_categories.banner.webBanner', 'product_categories.faq', 'product_categories.banner.mobileBanner', 'seo.schema'],
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


export async function getSingleProduct(lang, slug) {

  const blogBlockQuery = qs.stringify({

    locale: lang,
    filters: {

      slug: {
        $eq: slug,
      },

    },
    populate: ['productImage', 'seo', 'seo.schema', 'productSchema', 'productSchema.reviews',
      'related_products.productImage', 'product_categories', 'TDSFile', 'MSDSFile',
      'table'],
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


export async function geProductsBySearch(lang, query) {


  const searchProductQuery = qs.stringify({
    locale: lang,
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





export async function geProductsBySearchAdvance(lang, query) {


  const searchProductQuery = qs.stringify({
    locale: lang,
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

export async function getBlogPage(lang) {

  const blogBlockQuery = qs.stringify({
    locale: lang,
    populate: ['banner.webBanner', 'banner.mobileBanner', 'seo.schema'],

  });


  let blogPage = await fetchData("blog-page", blogBlockQuery);

  return blogPage
}

export async function getPosts(lang, currentPage, pageSize) {

  const PAGE_SIZE = pageSize;
  const blogBlockQuery = qs.stringify({
    locale: lang,
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


export async function geSinglePost(lang, slug) {

  const blogBlockQuery = qs.stringify({
    locale: lang,
    filters: {
      slug: {
        $eq: slug,
      },

    },
    populate: ['featureImage', 'seo', 'seo.schema', 'post_categories'],
  });


  return await fetchData("posts", blogBlockQuery);

}



export async function getAboutPage(lang) {

  const blogBlockQuery = qs.stringify({
    locale: lang,
    populate: ['aboutus.image', 'overValues', 'coreValue.image', 'overVisson.image', 'ourMission.image', 'qualities', 'qualities.image', 'seo.schema'],

  });

  let aboutPage = await fetchData("about-us", blogBlockQuery);
  return aboutPage
}


export async function getLubricantAddtives(lang) {

  const lubBlockQuery = qs.stringify({
    locale: lang,
    populate: ['text1', 'text2', 'textimage1', 'textimage1.image', 'whyUs', 'faq', 'seo', 'seo.schema'],

  });
  let lubricantAddtives = await fetchData("lubricant-additives-uae", lubBlockQuery);

  return lubricantAddtives
}


export async function getFaqPage(lang) {

  const faqBlockQuery = qs.stringify({
    locale: lang,
    populate: ['faq', 'seo', 'seo.schema'],
  });
  let faqPage = await fetchData("faq-page", faqBlockQuery);
  return faqPage
}



export async function getContactUsPageData(lang) {

  const conatcBlockQuery = qs.stringify({
    locale: lang,
    populate: ['addressBook', 'seo', 'seo.schema'],
  });
  return await fetchData("contact", conatcBlockQuery);

}


export async function getAllProductsSlug(lang = 'en') {
  const pageSize = 100;
  let page = 1;
  let allData = [];
  let hasNextPage = true;

  while (hasNextPage) {
    // Build the query string with pagination params
    const query = qs.stringify(
      {
        locale: lang,
        fields: ['slug', 'updatedAt'],
        'pagination[page]': page,
        'pagination[pageSize]': pageSize,
      },
      { encodeValuesOnly: true, arrayFormat: 'repeat' }
    );

    // Fetch one batch of products
    const response = await fetchData('products', query);
    const { data, meta } = response;

    // Accumulate the slugs
    allData = allData.concat(data);

    // Determine if there’s another page
    const pagination = meta?.pagination;
    hasNextPage = pagination && pagination.page < pagination.pageCount;
    page++;
  }

  // Return in the same shape as your original helper
  return { data: allData };
}


export async function getAllPostSlug(lang = 'en') {
  const pageSize = 100;
  let page = 1;
  let allData = [];
  let hasNextPage = true;

  while (hasNextPage) {
    // build Strapi query string
    const query = qs.stringify(
      {
        locale: lang,
        fields: ['slug', 'updatedAt'],
        'pagination[page]': page,
        'pagination[pageSize]': pageSize,
      },
      { encodeValuesOnly: true, arrayFormat: 'repeat' }
    );

    // fetch one “page” of posts
    const response = await fetchData('posts', query);
    const { data, meta } = response;

    // add them to our accumulator
    allData = allData.concat(data);

    // check if there are more pages
    const pagination = meta?.pagination;
    hasNextPage = pagination && pagination.page < pagination.pageCount;
    page++;
  }

  return { data: allData };
}


export async function geAllProductCategorySlug() {

  const blogBlockQuery = qs.stringify({
    fields: "slug",
  });
  return await fetchData("product-categories", blogBlockQuery);
}


export async function getProductCategory(lang, slug) {



  const blogBlockQuery = qs.stringify({
    locale: lang,
    filters: {

      slug: {
        $eq: slug,
      },
    },
    populate: ['image', 'banner', 'banner.webBanner', 'banner.mobileBanner', 'seo', 'seo.schema', 'faq'],

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


export async function getRedirectLinks() {

  let allRecords = [];
  let page = 1;
  const pageSize = 25;
  let hasMore = true;

  while (hasMore) {
    const blogBlockQuery = qs.stringify({
      filters: {},
      populate: [],
      pagination: {
        pageSize,
        page,
      },
    });

    const response = await fetchData("redirection-urls", blogBlockQuery);

    // Log response for debugging (remove when confirmed working)
    //console.log(`Page ${page} response:`, response);

    const records = response.data || [];
    allRecords = allRecords.concat(records);

    // Option 1: Using API metadata (if available)
    if (response.meta && response.meta.pagination) {
      const { pageCount, page: currentPage } = response.meta.pagination;
      hasMore = currentPage < pageCount;
    } else {
      // Option 2: Fallback - if the returned records count is less than the pageSize,
      // assume it's the last page.
      hasMore = records.length === pageSize;
    }

    page++;
  }

  return allRecords;
}

export async function getProductCategoryForHome(lang) {

  const blogBlockQuery = qs.stringify({
    locale: lang,
    fields: ['title', 'slug'],
    sort: ['index'],

  });
  return await fetchData("product-categories", blogBlockQuery);
}


export async function getPostBySearch(lang, query) {

  const searchPostQuery = qs.stringify({
    locale: lang,
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
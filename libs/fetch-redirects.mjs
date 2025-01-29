// fetchRedirects.js

//import { geAllRedirectionUrl } from "@/app/data/loader";

/*
   when add data in strapi add like this /about-us to /about 
   always use  / with link


*/


const fetchData = async () => {

};


export async function fetchRedirects() {



  const header =
  {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Strapi-Response-Format": "v4",
    },
    cache: "no-cache",
  }


  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const response = await fetch(baseUrl + 'redirection-urls?pagination[pageSize]=100', header);

  const jsonData = await response.json();

  // console.log("-----------------------redirect urls--------------------------------------------------");
  // console.dir(jsonData.data, { depth: null });
  // console.log("---------------------------End-----------------------end-----------------------");


  if (!response.ok) {
    console.error(`Error: Failed to fetch data. Status: ${response.status}`);
    return [
      {
        source: '/contact-us',
        destination: '/contact',
        permanent: true,
      },
    ];
  }




  // Check if jsonData is null or empty
  if (!jsonData || !jsonData.data || jsonData.data.length === 0) {
    console.log('No redirect data found.');
    return [
      {
        source: '/contact-us',
        destination: '/contact',
        permanent: true,
      },
    ]

  }



  return jsonData?.data?.map((redirect) => ({
    source: redirect.attributes.source,
    destination: redirect.attributes.destination,
    permanent: true,
  })) || [{
    source: '/hard-code',
    destination: '/contact',
    permanent: true,
  },];


  /*
    return [
      {
        source: '/contact-us', // automatically becomes /docs/with-basePath
        destination: '/contact', // automatically becomes /docs/another
        permanent: true,
      },
      {
        // does not add /docs since basePath: false is set
        source: '/about',
        destination: '/about-us',
        permanent: true,
      },
    ]
  */

}

export default fetchRedirects;

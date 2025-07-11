




import { getVideosLimitedData } from "../../data/loader";
import DisaplyFrontVideos from "../layout/DisaplyFrontVideos";

const FretchVideosWrapper = async ({ langText }) => {









    const videoData = await getVideosLimitedData();

    /* console.log("--------------------------video limited-----------------------------------");
 
     console.dir(videoData, { depth: null });
 
 
      const [componentKey, setComponentKey] = useState(Math.random()); // Unique key to force re-render
  
      useEffect(() => {
          setComponentKey(Math.random()); // Re-render when user navigates back
      }, []);
      */

    return <DisaplyFrontVideos VideoData={videoData} latestRelasetext={langText} />;


};

export default FretchVideosWrapper;

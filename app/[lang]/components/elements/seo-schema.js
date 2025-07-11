import SpeakableSchema from "./speakable-schema"


const SEOSchema = ({schemaList}) => {

     //console.log("SEO Schema Componenet Call");

     return (
      <>
        {schemaList && schemaList.length > 0 && (
          schemaList.map((schema) => (
            <script 
              key={schema.id} 
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: (schema.code) }} 
            />
          ))
        )}
      </>
    );
  };

export default SEOSchema

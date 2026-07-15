const axios=require("axios");

async function checkVoiceService(){

try{

const response=

await axios.get(

`${process.env.VOICE_SERVICE_URL}/health`

);

return{

available:true,

data:response.data

};

}catch{

return{

available:false

};

}

}

module.exports={

checkVoiceService

};
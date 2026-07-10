import axios from "axios";
import {VOICE_CONFIG} from "../config/voiceConfig";

export async function uploadVoice(blob){

const formData=new FormData();

formData.append(
"audio",
blob,
"voice.webm"
);

try{

const response=await axios.post(

"/api/voice/checkin",

formData,

{

headers:{
"Content-Type":"multipart/form-data"
},

timeout:VOICE_CONFIG.API_TIMEOUT_MS

}

);

return response.data;

}catch(error){

throw new Error(

error.response?.data?.message||

error.message||

"Voice upload failed."

);

}

}
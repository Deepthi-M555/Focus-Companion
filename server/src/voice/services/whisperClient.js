const fs=require("fs");
const FormData=require("form-data");

const VOICE_SERVICE_URL=
process.env.VOICE_SERVICE_URL||
"http://127.0.0.1:8000";

function delay(ms){
return new Promise(resolve=>setTimeout(resolve,ms));
}

async function transcribeAudio(audioPath){

if(!audioPath){
throw new Error("Audio path is required.");
}

const form=new FormData();

form.append(
"audio",
fs.createReadStream(audioPath)
);

for(let attempt=1;attempt<=2;attempt++){

try{

const controller=new AbortController();

const timeout=setTimeout(
()=>controller.abort(),
30000
);

const response=await fetch(
`${VOICE_SERVICE_URL}/transcribe`,
{
method:"POST",
body:form,
headers:form.getHeaders(),
signal:controller.signal
}
);

clearTimeout(timeout);

if(response.ok){
return await response.json();
}

const error=await response.text();

if(attempt===2){
throw new Error(
`Whisper service failed: ${error}`
);
}

}catch(error){

if(attempt===2){

throw new Error(
error.message||
"Voice transcription failed."
);

}

}

await delay(500);

}

}

module.exports={
transcribeAudio
};
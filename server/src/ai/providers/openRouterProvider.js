const OPENROUTER_URL="https://openrouter.ai/api/v1/chat/completions";

function delay(ms){
return new Promise(resolve=>setTimeout(resolve,ms));
}

async function requestOpenRouter(options){

for(let attempt=1;attempt<=2;attempt++){

try{

const response=await fetch(
OPENROUTER_URL,
options
);

if(response.ok){
return response;
}

const error=await response.text();

if(attempt===2){
throw new Error(
`OpenRouter request failed (${response.status}): ${error}`
);
}

}catch(error){

if(attempt===2){
throw error;
}

}

await delay(500);

}

}

async function classifyIntent(transcript){

if(!transcript?.trim()){
throw new Error("Transcript is empty.");
}

if(!process.env.OPENROUTER_API_KEY){
throw new Error("OPENROUTER_API_KEY is not configured.");
}

if(!process.env.OPENROUTER_MODEL){
throw new Error("OPENROUTER_MODEL is not configured.");
}

const response=await requestOpenRouter({

method:"POST",

headers:{
Authorization:`Bearer ${process.env.OPENROUTER_API_KEY}`,
"Content-Type":"application/json"
},

body:JSON.stringify({

model:process.env.OPENROUTER_MODEL,

messages:[

{
role:"system",
content:`
You are an intent classifier.

Return ONLY valid JSON.

Schema:

{
"intent":"CONTINUE|COMPLETE_SESSION|SNOOZE_SESSION|NEED_HELP",
"duration":number
}

Rules:

CONTINUE
User is still working.

COMPLETE_SESSION
User finished.

SNOOZE_SESSION
User asks for more time.

NEED_HELP
User is stuck or needs assistance.

duration should be 0 unless snooze.
`
},

{
role:"user",
content:transcript
}

],

temperature:0

})

});

const data=await response.json();

const content=data?.choices?.[0]?.message?.content;

if(!content){
throw new Error("OpenRouter returned an empty response.");
}

try{

return JSON.parse(content);

}catch{

throw new Error("OpenRouter returned invalid JSON.");

}

}

module.exports={
classifyIntent
};
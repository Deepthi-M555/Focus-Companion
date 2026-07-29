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
    role: "system",
    content: `
You are an intent classifier for an end-of-focus-session voice check-in.

Return ONLY valid JSON.
Do not include markdown, explanations, or extra text.

Schema:

{
    "intent": "COMPLETE_SESSION|NEED_HELP|UNKNOWN",
    "duration": 0,
    "confidence": number,
    "reply": string
}

Intent rules:

COMPLETE_SESSION
The user clearly indicates that the task or focus work is finished.
Examples:
"I finished it"
"I'm done"
"Yes, completed"
"I completed the task"

NEED_HELP
The user indicates that the task is unfinished, they are stuck,
they need help, or they could not complete the work.
Examples:
"I couldn't finish"
"I need more time"
"I'm stuck"
"I need help"
"I couldn't complete it"

UNKNOWN
The response is unclear, unrelated, ambiguous, or does not clearly
indicate completion or needing help.
Examples:
"maybe"
"what?"
"hello"
"I don't know"

Important rules:

- Never return CONTINUE.
- Never return SNOOZE_SESSION.
- Snoozing is controlled automatically by the backend timer and is NOT a voice intent.
- duration must always be 0.
- confidence must be a number between 0 and 1.
- reply should contain a short clarification message only when intent is UNKNOWN.
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
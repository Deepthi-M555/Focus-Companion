function logVoiceEvent({

sessionId,

intent,

transcript

}){

console.log({

timestamp:new Date(),

sessionId,

intent,

transcript

});

}

module.exports={
logVoiceEvent
};
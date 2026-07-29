function executeVoiceAction({action,io,sessionId}){

if(!io||!sessionId)return;

const room=io.to(sessionId);

switch(action){

    case"COMPLETE":
    room.emit("focus:complete");
    break;

    case"RECOVERY":
    room.emit("focus:recovery");
    break;

    default:
    break;

}

}

module.exports={executeVoiceAction};
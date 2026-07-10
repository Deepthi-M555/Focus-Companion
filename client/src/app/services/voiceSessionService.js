class VoiceSessionService{

constructor(){

this.activeSession=null;

}

setSession(sessionId){

this.activeSession=sessionId;

}

getSession(){

return this.activeSession;

}

clearSession(){

this.activeSession=null;

}

}

export default new VoiceSessionService();
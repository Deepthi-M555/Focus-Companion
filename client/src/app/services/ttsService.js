class TTSService{
speak(text){
return new Promise(resolve=>{
const utterance=new SpeechSynthesisUtterance(text);
utterance.onend=()=>resolve();
speechSynthesis.speak(utterance);
});
}
}

export default new TTSService();
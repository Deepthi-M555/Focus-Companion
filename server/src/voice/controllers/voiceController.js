const{
transcribeAudio
}=require("../services/whisperClient");

const{
deleteRecording
}=require("../services/recorderService");

const{
checkVoiceService
}=require(
"../services/voiceHealthService"
);

exports.processVoice=async(
req,
res
)=>{

if(!req.file){

return res.status(400).json({

success:false,

message:"Audio file is required."

});

}

const audioPath=req.file.path;

try{
    const health=
    await checkVoiceService();
    if(!health.available){
    return res.status(503).json({
    success:false,
    message:"Voice service unavailable."
    })
    }
    const transcriptResult=
    await transcribeAudio(
    audioPath
    );

    return res.json({
        success: true,
        transcript:
            transcriptResult.text,
        language:
            transcriptResult.language,
        confidence:
            transcriptResult.language_probability
    });

}

finally{

await deleteRecording(
audioPath
);

}

};
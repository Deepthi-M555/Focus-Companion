const {

    detectIntent,

    executeIntent

}=require(

    "../../services/intentService"

);

const FocusSession=

require(

    "../../models/FocusSession"

);

const CompanionSettings=

require(

    "../../models/CompanionSettings"

);

exports.voiceCheckIn=

async(req,res)=>{

try{

const{

transcript,

sessionId

}=req.body;

if(

!transcript||

!sessionId

){

return res.status(400).json({

success:false,

message:"Transcript and sessionId required."

});

}

const session=

await FocusSession.findById(

sessionId

);

if(!session){

return res.status(404).json({

success:false,

message:"Session not found."

});

}

const settings=

await CompanionSettings.findOne({

userId:session.user

});

const intent=

detectIntent(

transcript

);

const result=

executeIntent({

intent,

currentState:

session.status

});

return res.json({

success:true,

personality:

settings.personality,

intent,

nextState:

result.nextState,

action:

result.action

});

}

catch(error){

return res.status(500).json({

success:false,

message:error.message

});

}

};
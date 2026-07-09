import axios from "axios";

export async function uploadVoice(blob) {

    const formData = new FormData();

    formData.append(

        "audio",

        blob,

        "voice.webm"

    );

    const response = await axios.post(

        "/api/voice/check-in",

        formData,

        {

            headers: {

                "Content-Type":

                    "multipart/form-data"

            }

        }

    );

    return response.data;

}
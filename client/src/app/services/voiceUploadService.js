import api from "./api";
import { VOICE_CONFIG } from "../config/voiceConfig";

export async function uploadVoice(blob) {

    if (
        !blob ||
        blob.size === 0
    ) {
        throw new Error(
            "No audio was recorded."
        );
    }

    const formData =
        new FormData();

    formData.append(
        "audio",
        blob,
        "voice.webm"
    );

    try {

        const response =
            await api.post(
                "/voice/checkin",
                formData,
                {
                    timeout:
                        VOICE_CONFIG.API_TIMEOUT_MS
                }
            );

        return response.data;

    } catch (error) {
        const status =
            error.response?.status;
        const voiceError =
            new Error(
                error.response?.data?.error?.message ||
                error.response?.data?.message ||
                error.message ||
                "Voice upload failed."
            );

        voiceError.status = status;
        voiceError.code =
            status === 503
                ? "VOICE_SERVICE_UNAVAILABLE"
                : status
                ? "VOICE_UPLOAD_FAILED"
                : "VOICE_NETWORK_ERROR";

        throw voiceError;
    }
}

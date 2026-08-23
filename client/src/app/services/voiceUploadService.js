const isElectron =
    Boolean(
        window.electronAPI?.isElectron
    );


const VOICE_URL =
    isElectron
        ? "http://127.0.0.1:8001"
        : (
            import.meta.env.VITE_VOICE_URL ||
            "http://127.0.0.1:8001"
        );
        
const VOICE_TIMEOUT_MS = 30000;


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


    const controller =
        new AbortController();

    const timeout =
        setTimeout(
            () => {
                controller.abort();
            },
            VOICE_TIMEOUT_MS
        );


    try {

        const response =
            await fetch(
                `${VOICE_URL}/transcribe`,
                {
                    method: "POST",

                    body: formData,

                    signal:
                        controller.signal
                }
            );


        if (!response.ok) {

            let detail =
                "Voice transcription failed.";

            try {

                const body =
                    await response.json();

                detail =
                    body?.detail ||
                    body?.error ||
                    detail;

            } catch {
                // Response was not JSON.
            }

            const error =
                new Error(
                    detail
                );

            error.status =
                response.status;

            error.code =
                response.status === 503
                    ? "VOICE_SERVICE_UNAVAILABLE"
                    : "VOICE_UPLOAD_FAILED";

            throw error;
        }


        const data =
            await response.json();


        const transcript =
            (
                data?.text ||
                data?.transcript ||
                ""
            ).trim();


        return {
            ...data,
            transcript
        };


    } catch (error) {

        if (
            error.name ===
            "AbortError"
        ) {

            const timeoutError =
                new Error(
                    "Voice transcription timed out."
                );

            timeoutError.code =
                "VOICE_NETWORK_ERROR";

            throw timeoutError;
        }


        if (
            error.code
        ) {
            throw error;
        }


        const networkError =
            new Error(
                error.message ||
                "Voice service is unavailable."
            );

        networkError.code =
            "VOICE_NETWORK_ERROR";

        throw networkError;


    } finally {

        clearTimeout(
            timeout
        );

    }

}
class VoiceRecorder {

    constructor() {

        this.mediaRecorder = null;
        this.stream = null;
        this.chunks = [];

    }

    async start() {

        if (
            typeof navigator === "undefined" ||
            !navigator.mediaDevices?.getUserMedia
        ) {
            const error =
                new Error("Microphone capture is unavailable in this browser.");
            error.code = "MICROPHONE_UNAVAILABLE";
            throw error;
        }

        if (
            typeof MediaRecorder === "undefined"
        ) {
            const error =
                new Error("MediaRecorder is unavailable in this browser.");
            error.code = "MEDIA_RECORDER_UNAVAILABLE";
            throw error;
        }

        try {
            this.stream =
                await navigator.mediaDevices.getUserMedia({
                    audio: true
                });
        } catch (error) {
            error.code =
                error.name === "NotAllowedError"
                    ? "MICROPHONE_PERMISSION_DENIED"
                    : "MICROPHONE_CAPTURE_FAILED";
            throw error;
        }

        this.chunks = [];

        const mimeType =
            MediaRecorder.isTypeSupported(
                "audio/webm;codecs=opus"
            )
                ? "audio/webm;codecs=opus"
                : "audio/webm";

        try {
            this.mediaRecorder =
                new MediaRecorder(
                    this.stream,
                    { mimeType }
                );
        } catch (error) {
            this.stream
                ?.getTracks()
                .forEach(
                    track =>
                        track.stop()
                );
            error.code = "MEDIA_RECORDER_FAILED";
            throw error;
        }

        this.mediaRecorder.ondataavailable =
            (event) => {

                if (
                    event.data?.size > 0
                ) {
                    this.chunks.push(
                        event.data
                    );
                }
            };

        this.mediaRecorder.start();
    }

    stop() {

        return new Promise(
            (resolve, reject) => {

                if (!this.mediaRecorder) {

                    resolve(
                        new Blob([], {
                            type:
                                "audio/webm"
                        })
                    );

                    return;
                }

                this.mediaRecorder.onstop =
                    () => {

                        const blob =
                            new Blob(
                                this.chunks,
                                {
                                    type:
                                        this.mediaRecorder.mimeType ||
                                        "audio/webm"
                                }
                            );

                        this.stream
                            ?.getTracks()
                            .forEach(
                                track =>
                                    track.stop()
                            );

                        this.mediaRecorder = null;
                        this.stream = null;
                        this.chunks = [];

                        resolve(blob);
                    };

                this.mediaRecorder.onerror =
                    (event) => {

                        this.stream
                            ?.getTracks()
                            .forEach(
                                track =>
                                    track.stop()
                            );

                        reject(
                            event.error ||
                            new Error(
                                "Audio recording failed."
                            )
                        );
                    };

                this.mediaRecorder.stop();
            }
        );
    }
}

export default VoiceRecorder;

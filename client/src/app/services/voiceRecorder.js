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

        console.log("[VoiceRecorder] getUserMedia called");

        try {
            this.stream =
                await navigator.mediaDevices.getUserMedia({
                    audio: true
                });

            console.log(
                "[VoiceRecorder] stream obtained, tracks:",
                this.stream.getTracks().length
            );
        } catch (error) {
            console.error(
                "[VoiceRecorder] getUserMedia failed:",
                error
            );
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

            console.log(
                "[VoiceRecorder] MediaRecorder created with mimeType:",
                mimeType
            );
        } catch (error) {
            console.error(
                "[VoiceRecorder] MediaRecorder creation failed:",
                error
            );
            this.stream
                ?.getTracks()
                .forEach(
                    track => {
                        console.log(
                            "[VoiceRecorder] stopping track:",
                            track.kind
                        );
                        track.stop();
                    }
                );
            error.code = "MEDIA_RECORDER_FAILED";
            throw error;
        }

        this.mediaRecorder.ondataavailable =
            (event) => {

                console.log(
                    "[VoiceRecorder] dataavailable event, size:",
                    event.data?.size
                );

                if (
                    event.data?.size > 0
                ) {
                    this.chunks.push(
                        event.data
                    );
                }
            };

        this.mediaRecorder.start();

        console.log("[VoiceRecorder] start() called on MediaRecorder");
    }

    stop() {

        return new Promise(
            (resolve, reject) => {

                console.log("[VoiceRecorder] stop() called");

                if (!this.mediaRecorder) {

                    console.warn(
                        "[VoiceRecorder] stop() called but no mediaRecorder; returning empty blob"
                    );

                    this.stream
                        ?.getTracks()
                        .forEach(
                            track => {
                                console.log(
                                    "[VoiceRecorder] stopping orphan track:",
                                    track.kind
                                );
                                track.stop();
                            }
                        );

                    this.stream = null;

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

                        console.log(
                            "[VoiceRecorder] onstop: blob created, size:",
                            blob.size,
                            ", chunks:",
                            this.chunks.length
                        );

                        this.stream
                            ?.getTracks()
                            .forEach(
                                track => {
                                    console.log(
                                        "[VoiceRecorder] stopping track in onstop:",
                                        track.kind
                                    );
                                    track.stop();
                                }
                            );

                        this.mediaRecorder = null;
                        this.stream = null;
                        this.chunks = [];

                        resolve(blob);
                    };

                this.mediaRecorder.onerror =
                    (event) => {

                        console.error(
                            "[VoiceRecorder] onerror event:",
                            event.error
                        );

                        this.stream
                            ?.getTracks()
                            .forEach(
                                track => {
                                    console.log(
                                        "[VoiceRecorder] stopping track in onerror:",
                                        track.kind
                                    );
                                    track.stop();
                                }
                            );

                        this.mediaRecorder = null;
                        this.stream = null;
                        this.chunks = [];

                        reject(
                            event.error ||
                            new Error(
                                "Audio recording failed."
                            )
                        );
                    };

                console.log("[VoiceRecorder] calling stop() on mediaRecorder");
                this.mediaRecorder.stop();
            }
        );
    }
}

export default VoiceRecorder;

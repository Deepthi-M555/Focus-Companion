class TTSService {
    constructor() {
        this.activeTtsPromise = null;
        this.lastText = null;
    }

    async stop() {
        if (window.electronAPI?.stopSpeaking) {
            try {
                await window.electronAPI.stopSpeaking();
            } catch (error) {
                console.warn(
                    "[TTS] native stop failed:",
                    error
                );
            }
        }

        this.activeTtsPromise = null;
        this.lastText = null;
    }

    async speak(text) {
        const safeText =
            String(text ?? "").trim();

        if (!safeText) {
            console.warn(
                "[TTS] empty text"
            );

            return false;
        }

        if (
            this.activeTtsPromise &&
            this.lastText === safeText
        ) {
            console.log(
                "[TTS] duplicate speech suppressed"
            );

            return this.activeTtsPromise;
        }

        if (
            !window.electronAPI?.speak
        ) {
            console.error(
                "[TTS] Electron native TTS unavailable"
            );

            return false;
        }

        await this.stop();

        this.lastText = safeText;

        this.activeTtsPromise =
            (async () => {

                try {

                    console.log(
                        "[TTS:NATIVE] requesting:",
                        safeText
                    );

                    const result =
                        await window.electronAPI.speak(
                            safeText
                        );

                    console.log(
                        "[TTS:NATIVE] result:",
                        result
                    );

                    if (
                        result?.success
                    ) {

                        console.log(
                            "[TTS:NATIVE] completed"
                        );

                        return true;
                    }

                    throw new Error(
                        result?.error ||
                        "Native Windows TTS failed"
                    );

                } catch (error) {

                    console.error(
                        "[TTS:NATIVE] failed:",
                        error
                    );

                    return false;

                } finally {

                    if (
                        this.lastText ===
                        safeText
                    ) {
                        this.activeTtsPromise =
                            null;

                        this.lastText =
                            null;
                    }
                }

            })();

        return this.activeTtsPromise;
    }
}

export default new TTSService();
class TTSService {
    constructor() {
        this.voice = null;

        if ("speechSynthesis" in window) {
            window.speechSynthesis.onvoiceschanged = () => {
                this.voice = this.findFemaleVoice();
            };

            this.voice = this.findFemaleVoice();
        }
    }

    findFemaleVoice() {
        const voices =
            window.speechSynthesis?.getVoices?.() || [];

        if (!voices.length) {
            return null;
        }

        const femaleNames = [
            "Samantha",
            "Victoria",
            "Karen",
            "Zira",
            "Jenny",
            "Aria",
            "Ava",
            "Hazel",
            "Sonia",
            "Google UK English Female",
            "Google US English",
            "Microsoft Zira",
            "Microsoft Jenny"
        ];

        const femaleVoice =
            voices.find(voice =>
                femaleNames.some(name =>
                    voice.name
                        .toLowerCase()
                        .includes(name.toLowerCase())
                )
            );

        if (femaleVoice) {
            return femaleVoice;
        }

        return (
            voices.find(voice =>
                voice.lang?.toLowerCase().startsWith("en-in")
            ) ||
            voices.find(voice =>
                voice.lang?.toLowerCase().startsWith("en-us")
            ) ||
            voices.find(voice =>
                voice.lang?.toLowerCase().startsWith("en-gb")
            ) ||
            voices[0]
        );
    }

    async speak(text) {
        if (
            typeof window === "undefined" ||
            !("speechSynthesis" in window)
        ) {
            return false;
        }

        const speakNow = () => {
            return new Promise((resolve, reject) => {
                const utterance =
                    new SpeechSynthesisUtterance(text);

                const voice =
                    this.voice ||
                    this.findFemaleVoice();

                if (voice) {
                    utterance.voice = voice;
                }

                utterance.lang =
                    voice?.lang || "en-IN";

                utterance.rate = 0.95;
                utterance.pitch = 1.05;
                utterance.volume = 1;

                utterance.onend = () => resolve(true);

                utterance.onerror = (event) => {
                    console.error(
                        "TTS error:",
                        event
                    );

                    reject(
                        new Error(
                            "FYNIX voice playback failed."
                        )
                    );
                };

                window.speechSynthesis.cancel();

                window.speechSynthesis.speak(
                    utterance
                );
            });
        };

        const voices =
            window.speechSynthesis.getVoices();

        if (!voices.length) {
            await new Promise(resolve => {
                const handler = () => {
                    window.speechSynthesis.removeEventListener(
                        "voiceschanged",
                        handler
                    );

                    resolve();
                };

                window.speechSynthesis.addEventListener(
                    "voiceschanged",
                    handler
                );

                setTimeout(resolve, 1000);
            });
        }

        this.voice =
            this.voice ||
            this.findFemaleVoice();

        return speakNow();
    }
}

export default new TTSService();
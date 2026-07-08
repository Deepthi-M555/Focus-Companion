class SpeechRecognitionService {

    constructor() {

        const SpeechRecognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            throw new Error("Speech Recognition is not supported.");
        }

        this.recognition = new SpeechRecognition();

        this.recognition.lang = "en-US";
        this.recognition.interimResults = true;
        this.recognition.continuous = false;
        this.recognition.maxAlternatives = 1;
    }

    start({

        onStart,

        onResult,

        onEnd,

        onError

    }) {

        this.recognition.onstart = () => {

            onStart?.();

        };

        this.recognition.onresult = (event) => {

            let transcript = "";

            for (

                let i = event.resultIndex;

                i < event.results.length;

                i++

            ) {

                transcript +=
                    event.results[i][0].transcript;

            }

            onResult?.(

                transcript,

                event.results[
                    event.results.length - 1
                ].isFinal

            );

        };

        this.recognition.onend = () => {

            onEnd?.();

        };

        this.recognition.onerror = (error) => {
            onError?.(error);
        };
        this.recognition.start();
    }
    stop() {
        this.recognition.stop();
    }
}
export default SpeechRecognitionService;
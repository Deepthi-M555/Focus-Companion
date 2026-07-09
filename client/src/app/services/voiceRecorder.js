class VoiceRecorder {

    constructor() {

        this.mediaRecorder = null;

        this.chunks = [];

    }

    async start() {

        const stream =
            await navigator.mediaDevices.getUserMedia({

                audio: true

            });

        this.chunks = [];

        this.mediaRecorder =
            new MediaRecorder(stream);

        this.mediaRecorder.ondataavailable = (

            event

        ) => {

            this.chunks.push(event.data);

        };

        this.mediaRecorder.start();

    }

    stop() {

        return new Promise(resolve => {

            this.mediaRecorder.onstop = () => {

                const blob =
                    new Blob(

                        this.chunks,

                        {

                            type:

                                "audio/webm"

                        }

                    );

                resolve(blob);

            };

            this.mediaRecorder.stop();

        });

    }

}

export default VoiceRecorder;
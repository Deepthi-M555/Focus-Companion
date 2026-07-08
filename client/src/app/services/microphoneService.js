export async function requestMicrophonePermission() {

    try {

        await navigator.mediaDevices.getUserMedia({

            audio: true

        });

        return true;

    }

    catch {

        return false;

    }

}
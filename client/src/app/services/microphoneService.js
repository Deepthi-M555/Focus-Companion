export async function requestMicrophonePermission() {
    let stream = null;
    try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        return true;
    } catch {
        return false;
    } finally {
        // This function only checks permission. Do not leave a microphone
        // stream open; VoiceRecorder will acquire the real recording stream.
        stream?.getTracks().forEach(track => track.stop());
    }
}

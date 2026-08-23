import {
    useState,
    useEffect,
    useRef
} from "react";

import {
    Mic,
    X
} from "lucide-react";

import {
    motion
} from "motion/react";

import {
    requestMicrophonePermission
} from "../services/microphoneService";

import socket, {
    connectSocket
} from "../services/socketService";

import {
    VOICE_CONFIG
} from "../config/voiceConfig";

import VoiceRecorder from "../services/voiceRecorder";

import {
    uploadVoice
} from "../services/voiceUploadService";


const VoiceStates = {

    IDLE: "idle",

    SPEAKING: "speaking",

    LISTENING: "listening",

    PROCESSING: "processing",

    COMPLETED: "completed",

    SNOOZED: "snoozed",

    RECOVERY: "recovery",

    ERROR: "error"

};


export function Overlay() {

    const [
        voiceState,
        setVoiceState
    ] = useState(
        VoiceStates.IDLE
    );


    const [
        transcript,
        setTranscript
    ] = useState("");


    const [
        sessionId,
        setSessionId
    ] = useState(null);


    const recorder =
        useRef(
            new VoiceRecorder()
        );


    /*
     * Prevent multiple voice flows
     * from running simultaneously.
     */
    const voiceFlowActiveRef =
        useRef(false);


    /*
     * The session for which a
     * clarification has already
     * been attempted.
     *
     * IMPORTANT:
     * This is session-specific.
     */
    const clarificationSessionRef =
        useRef(null);


    /*
     * Prevent duplicate Electron
     * check-in notifications for the
     * same session.
     */
    const activeCheckInSessionRef =
        useRef(null);


    /*
     * Prevent sending more than one
     * voice-response for the same
     * recording flow.
     */
    const responseSentRef =
        useRef(false);


    /*
     * Current session ref avoids
     * stale React state inside
     * socket callbacks.
     */
    const currentSessionRef =
        useRef(null);


    /*
     * --------------------------------------------------
     * START VOICE CHECK-IN
     * --------------------------------------------------
     */

    const startVoiceCheckIn =
        async (
            data,
            isClarification = false
        ) => {

            const currentSessionId =
                data?.sessionId ||
                currentSessionRef.current;


            if (!currentSessionId) {

                console.error(
                    "[Overlay] No session ID."
                );

                return;

            }


            /*
             * Never run two recordings
             * simultaneously.
             */

            if (
                voiceFlowActiveRef.current
            ) {

                console.log(
                    "[Overlay] Voice flow already active. Ignoring duplicate."
                );

                return;

            }


            /*
             * Only ONE clarification
             * per session.
             */

            if (
                isClarification &&
                clarificationSessionRef.current ===
                    currentSessionId
            ) {

                console.log(
                    "[Overlay] Clarification already attempted for this session. Waiting for backend timeout."
                );

                return;

            }


            if (isClarification) {

                clarificationSessionRef.current =
                    currentSessionId;

            }


            voiceFlowActiveRef.current =
                true;


            responseSentRef.current =
                false;


            try {

                const question =
                    data?.message ||
                    VOICE_CONFIG.CHECK_IN_MESSAGE;


                console.log(
                    "[Overlay] Starting voice check-in",
                    {
                        sessionId:
                            currentSessionId,

                        clarification:
                            isClarification
                    }
                );


                setTranscript("");


                setVoiceState(
                    VoiceStates.SPEAKING
                );


                /*
                 * --------------------------------------
                 * TTS
                 * --------------------------------------
                 */

                await window.electronAPI?.speak?.(
                    question
                );


                /*
                 * --------------------------------------
                 * MICROPHONE PERMISSION
                 * --------------------------------------
                 */

                const allowed =
                    await requestMicrophonePermission();


                if (!allowed) {

                    console.error(
                        "[Overlay] Microphone permission denied."
                    );

                    setVoiceState(
                        VoiceStates.ERROR
                    );

                    return;

                }


                /*
                 * --------------------------------------
                 * RECORD
                 * --------------------------------------
                 */

                setVoiceState(
                    VoiceStates.LISTENING
                );


                await recorder.current.start();


                await new Promise(
                    resolve => {

                        setTimeout(
                            resolve,

                            VOICE_CONFIG
                                .RECORDING_DURATION_MS
                        );

                    }
                );


                /*
                 * --------------------------------------
                 * STOP RECORDING
                 * --------------------------------------
                 */

                const blob =
                    await recorder.current.stop();


                if (
                    !blob ||
                    blob.size === 0
                ) {

                    console.log(
                        "[Overlay] No audio captured. Waiting for backend timeout."
                    );

                    setVoiceState(
                        VoiceStates.IDLE
                    );

                    return;

                }


                /*
                 * --------------------------------------
                 * TRANSCRIBE
                 * --------------------------------------
                 */

                setVoiceState(
                    VoiceStates.PROCESSING
                );


                const result =
                    await uploadVoice(
                        blob
                    );


                const text =
                    (
                        result?.transcript ||
                        result?.text ||
                        ""
                    ).trim();


                console.log(
                    "[Overlay] Transcript:",
                    text
                );


                /*
                 * EMPTY TRANSCRIPT
                 *
                 * Do NOT emit voice-response.
                 */

                if (!text) {

                    console.log(
                        "[Overlay] Empty transcript. Backend will handle timeout/snooze."
                    );

                    setTranscript("");

                    setVoiceState(
                        VoiceStates.IDLE
                    );

                    return;

                }


                setTranscript(
                    text
                );


                /*
                 * --------------------------------------
                 * SEND EXACTLY ONE RESPONSE
                 * --------------------------------------
                 */

                if (
                    responseSentRef.current
                ) {

                    console.log(
                        "[Overlay] Response already sent. Ignoring duplicate."
                    );

                    return;

                }


                responseSentRef.current =
                    true;


                socket.emit(
                    "voice-response",
                    {
                        sessionId:
                            currentSessionId,

                        transcript:
                            text
                    }
                );


                console.log(
                    "[Overlay] voice-response emitted",
                    {
                        sessionId:
                            currentSessionId
                    }
                );


            } catch (
                error
            ) {

                console.error(
                    "[Overlay] Voice check-in failed:",
                    error
                );


                setVoiceState(
                    VoiceStates.ERROR
                );


            } finally {

                /*
                 * The recording is finished.
                 *
                 * IMPORTANT:
                 * We clear the flow lock here,
                 * but NOT the clarification
                 * session lock.
                 *
                 * Therefore another
                 * focus:clarify event for
                 * the same session cannot
                 * start another recording.
                 */

                voiceFlowActiveRef.current =
                    false;

            }

        };


    /*
     * --------------------------------------------------
     * SOCKET / ELECTRON EVENTS
     * --------------------------------------------------
     */

    useEffect(
        () => {

            connectSocket();


            const handleConnect =
                () => {

                    console.log(
                        "[Overlay:SOCKET] Connected:",
                        socket.id
                    );

                };


            const handleConnectError =
                error => {

                    console.error(
                        "[Overlay:SOCKET] Connection error:",
                        error
                    );

                };


            socket.on(
                "connect",
                handleConnect
            );


            socket.on(
                "connect_error",
                handleConnectError
            );


            /*
             * --------------------------------------
             * ELECTRON CHECK-IN
             * --------------------------------------
             */

            const handleElectronCheckIn =
                data => {

                    const incomingSessionId =
                        data?.sessionId;


                    if (
                        !incomingSessionId
                    ) {

                        console.error(
                            "[Overlay] Check-in received without sessionId."
                        );

                        return;

                    }


                    /*
                     * IMPORTANT:
                     *
                     * If Electron sends the
                     * same check-in twice,
                     * ignore the duplicate.
                     */

                    if (
                        activeCheckInSessionRef.current ===
                        incomingSessionId
                    ) {

                        console.log(
                            "[Overlay] Duplicate Electron check-in ignored:",
                            incomingSessionId
                        );

                        return;

                    }


                    activeCheckInSessionRef.current =
                        incomingSessionId;


                    currentSessionRef.current =
                        incomingSessionId;


                    setSessionId(
                        incomingSessionId
                    );


                    /*
                     * New session = new
                     * clarification allowance.
                     */

                    clarificationSessionRef.current =
                        null;


                    responseSentRef.current =
                        false;


                    const joinSession =
                        () => {

                            socket.emit(
                                "join_focus_session",
                                incomingSessionId
                            );


                            console.log(
                                "[Overlay:SOCKET] Joined focus session:",
                                incomingSessionId
                            );

                        };


                    if (
                        socket.connected
                    ) {

                        joinSession();

                    } else {

                        socket.once(
                            "connect",
                            joinSession
                        );

                    }


                    startVoiceCheckIn(
                        data,
                        false
                    );

                };


            const removeElectronListener =
                window
                    .electronAPI
                    ?.onCheckInRequired?.(
                        handleElectronCheckIn
                    );


            window
                .electronAPI
                ?.notifyOverlayReady?.();


            /*
             * --------------------------------------
             * SESSION COMPLETE
             * --------------------------------------
             */

            const handleComplete =
                () => {

                    console.log(
                        "[Overlay] Session completed."
                    );


                    voiceFlowActiveRef.current =
                        false;


                    clarificationSessionRef.current =
                        null;


                    activeCheckInSessionRef.current =
                        null;


                    currentSessionRef.current =
                        null;


                    setVoiceState(
                        VoiceStates.COMPLETED
                    );


                    window
                        .electronAPI
                        ?.hideOverlay?.();

                };


            socket.on(
                "focus:complete",
                handleComplete
            );


            /*
             * --------------------------------------
             * NEXT TASK
             * --------------------------------------
             */

            const handleNextTask =
                data => {

                    console.log(
                        "[Overlay:SOCKET] Current task completed; next task:",
                        data?.task?.title ||
                        data?.task?.name
                    );


                    voiceFlowActiveRef.current =
                        false;


                    clarificationSessionRef.current =
                        null;


                    activeCheckInSessionRef.current =
                        null;


                    currentSessionRef.current =
                        null;


                    setVoiceState(
                        VoiceStates.COMPLETED
                    );


                    window
                        .electronAPI
                        ?.hideOverlay?.();

                };


            socket.on(
                "focus:next-task",
                handleNextTask
            );


            /*
             * --------------------------------------
             * CLARIFICATION
             * --------------------------------------
             */

            const handleClarify =
                async data => {

                    const clarificationSessionId =
                        data?.sessionId ||
                        currentSessionRef.current;


                    console.log(
                        "[Overlay:SOCKET] Clarification requested:",
                        {
                            sessionId:
                                clarificationSessionId,

                            message:
                                data?.message
                        }
                    );


                    if (
                        !clarificationSessionId
                    ) {

                        console.error(
                            "[Overlay] Clarification has no session ID."
                        );

                        return;

                    }


                    /*
                     * CRITICAL GUARD:
                     *
                     * Backend may emit
                     * focus:clarify more than
                     * once.
                     *
                     * Only the FIRST one
                     * is allowed to start
                     * another recording.
                     */

                    if (
                        clarificationSessionRef.current ===
                        clarificationSessionId
                    ) {

                        console.log(
                            "[Overlay] Duplicate clarification ignored."
                        );

                        return;

                    }


                    /*
                     * Mark it BEFORE starting
                     * async voice work.
                     *
                     * This prevents two
                     * focus:clarify events
                     * arriving almost
                     * simultaneously from
                     * both starting recordings.
                     */
                    currentSessionRef.current =
                        clarificationSessionId;
                    try {

                        await startVoiceCheckIn(
                            {
                                sessionId:
                                    clarificationSessionId,

                                message:
                                    data?.message ||
                                    "Please tell me whether you finished the task or need help."
                            },

                            true
                        );

                    } catch (
                        error
                    ) {

                        console.error(
                            "[Overlay] Clarification failed:",
                            error
                        );


                        setVoiceState(
                            VoiceStates.ERROR
                        );

                    }

                };


            socket.on(
                "focus:clarify",
                handleClarify
            );


            /*
             * --------------------------------------
             * SNOOZED
             * --------------------------------------
             */

            const handleSnoozed =
                () => {

                    console.log(
                        "[Overlay] Session snoozed by backend."
                    );


                    voiceFlowActiveRef.current =
                        false;


                    clarificationSessionRef.current =
                        null;


                    activeCheckInSessionRef.current =
                        null;


                    currentSessionRef.current =
                        null;


                    setVoiceState(
                        VoiceStates.SNOOZED
                    );


                    window
                        .electronAPI
                        ?.hideOverlay?.();

                };


            socket.on(
                "focus:snoozed",
                handleSnoozed
            );


            /*
             * --------------------------------------
             * RECOVERY
             * --------------------------------------
             */

            const handleRecovery =
                () => {

                    console.log(
                        "[Overlay] Session entered recovery."
                    );


                    voiceFlowActiveRef.current =
                        false;


                    clarificationSessionRef.current =
                        null;


                    activeCheckInSessionRef.current =
                        null;


                    currentSessionRef.current =
                        null;


                    setVoiceState(
                        VoiceStates.RECOVERY
                    );


                    window
                        .electronAPI
                        ?.hideOverlay?.();

                };


            socket.on(
                "focus:recovery",
                handleRecovery
            );


            /*
             * --------------------------------------
             * CLEANUP
             * --------------------------------------
             */

            return () => {

                removeElectronListener?.();


                socket.off(
                    "connect",
                    handleConnect
                );


                socket.off(
                    "connect_error",
                    handleConnectError
                );


                socket.off(
                    "focus:complete",
                    handleComplete
                );


                socket.off(
                    "focus:next-task",
                    handleNextTask
                );


                socket.off(
                    "focus:clarify",
                    handleClarify
                );


                socket.off(
                    "focus:snoozed",
                    handleSnoozed
                );


                socket.off(
                    "focus:recovery",
                    handleRecovery
                );

            };

        },
        []
    );


    /*
     * Transparent overlay body.
     */

    useEffect(
        () => {

            document.body.style.backgroundColor =
                "transparent";

            document.body.style.overflow =
                "hidden";


            return () => {

                document.body.style.backgroundColor =
                    "";

                document.body.style.overflow =
                    "";

            };

        },
        []
    );


    /*
     * --------------------------------------------------
     * UI
     * --------------------------------------------------
     */

    return (

        <div className="h-screen w-screen flex items-center justify-center p-4 selection:bg-blue-500/30">

            <motion.div

                initial={{
                    y: -20,
                    opacity: 0
                }}

                animate={{
                    y: 0,
                    opacity: 1
                }}

                className="w-full max-w-sm bg-white/90 dark:bg-[#121212]/90 backdrop-blur-2xl border border-neutral-200/50 dark:border-neutral-800/50 rounded-2xl shadow-2xl overflow-hidden p-6"

                style={{
                    WebkitAppRegion:
                        "drag"
                }}

            >

                <div className="flex items-center justify-between mb-4">

                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">

                        FYNIX Check-in

                    </h2>


                    <button

                        onClick={() =>
                            window
                                .electronAPI
                                ?.hideOverlay?.()
                        }

                        className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors text-neutral-600 dark:text-neutral-400"

                        style={{
                            WebkitAppRegion:
                                "no-drag"
                        }}

                        aria-label="Close overlay"

                    >

                        <X className="w-5 h-5" />

                    </button>

                </div>


                <div className="flex justify-center mb-4">

                    <div

                        className={`p-4 rounded-full ${
                            voiceState ===
                            VoiceStates.LISTENING
                                ? "bg-blue-100 dark:bg-blue-900/30 animate-pulse"

                                : voiceState ===
                                  VoiceStates.SPEAKING
                                    ? "bg-green-100 dark:bg-green-900/30 animate-pulse"

                                    : voiceState ===
                                      VoiceStates.PROCESSING
                                        ? "bg-yellow-100 dark:bg-yellow-900/30 animate-pulse"

                                        : voiceState ===
                                          VoiceStates.ERROR
                                            ? "bg-red-100 dark:bg-red-900/30"

                                            : "bg-neutral-100 dark:bg-neutral-800"
                        }`}

                    >

                        <Mic

                            className={`w-8 h-8 ${
                                voiceState ===
                                VoiceStates.LISTENING
                                    ? "text-blue-600 dark:text-blue-400"

                                    : voiceState ===
                                      VoiceStates.SPEAKING
                                        ? "text-green-600 dark:text-green-400"

                                        : voiceState ===
                                          VoiceStates.PROCESSING
                                            ? "text-yellow-600 dark:text-yellow-400"

                                            : voiceState ===
                                              VoiceStates.ERROR
                                                ? "text-red-600 dark:text-red-400"

                                                : "text-neutral-600 dark:text-neutral-400"
                            }`}

                        />

                    </div>

                </div>


                <p className="text-center text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-3">

                    {voiceState ===
                        VoiceStates.SPEAKING &&
                        "FYNIX is speaking..."}

                    {voiceState ===
                        VoiceStates.LISTENING &&
                        "Listening to your response..."}

                    {voiceState ===
                        VoiceStates.PROCESSING &&
                        "Processing your voice..."}

                    {voiceState ===
                        VoiceStates.COMPLETED &&
                        "Check-in complete"}

                    {voiceState ===
                        VoiceStates.SNOOZED &&
                        "Session snoozed"}

                    {voiceState ===
                        VoiceStates.RECOVERY &&
                        "Recovery initiated"}

                    {voiceState ===
                        VoiceStates.ERROR &&
                        "Something went wrong"}

                    {voiceState ===
                        VoiceStates.IDLE &&
                        "Ready"}

                </p>


                {transcript && (

                    <p className="text-xs text-neutral-600 dark:text-neutral-400 text-center mb-4 italic">

                        "{transcript}"

                    </p>

                )}


                <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center">

                    Speak your response when ready

                </p>

            </motion.div>

        </div>

    );

}
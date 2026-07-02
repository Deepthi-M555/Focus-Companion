import api from "./api";

export async function startSession(data) {

    const { data: response } =
        await api.post(
            "/sessions/start",
            data
        );

    return response;

}

export async function completeSession(sessionId) {

    const { data } =
        await api.post(
            `/sessions/complete/${sessionId}`
        );

    return data;

}

export async function failSession(sessionId) {

    const { data } =
        await api.post(
            `/sessions/fail/${sessionId}`
        );

    return data;

}

export async function snoozeSession(sessionId) {

    const { data } =
        await api.post(
            `/sessions/snooze/${sessionId}`
        );

    return data;

}

export async function resumeSession() {

    const { data } =
        await api.get(
            "/sessions/resume"
        );

    return data;

}
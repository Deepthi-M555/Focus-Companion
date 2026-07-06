import api from "./api";

export async function startSession(data, owner = "WEB") {

    const { data: response } =
        await api.post(
            "/sessions/start",
            { ...data, owner }
        );

    return response;

}

export async function completeSession(sessionId, owner = "WEB") {

    const { data } =
        await api.post(
            `/sessions/complete/${sessionId}`,
            { owner }
        );

    return data;

}

export async function failSession(sessionId, owner = "WEB") {

    const { data } =
        await api.post(
            `/sessions/fail/${sessionId}`,
            { owner }
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

export async function pauseSession(sessionId, owner = "WEB"){

    const{

        data

    }=await api.post(

        `/sessions/pause/${sessionId}`,
        { owner }

    );

    return data;

}

export async function resumePausedSession(sessionId, owner = "WEB"){

    const{

        data

    }=await api.post(

        `/sessions/resume/${sessionId}`,
        { owner }

    );

    return data;

}

export async function skipSession(sessionId){

    const{

        data

    }=await api.post(

        `/sessions/skip/${sessionId}`

    );

    return data;

}

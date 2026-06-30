import api from "./api";

export async function startSession() {

    const response =
        await api.post(
            "/session/start"
        );

    return response.data;

}

export async function pauseSession() {

    return api.patch(
        "/session/pause"
    );

}

export async function completeSession() {

    return api.patch(
        "/session/complete"
    );

}
import api from "./api";

export async function saveSchedule(data) {
    const response = await api.post(
        "/tasks/save",
        data
    );

    return response.data;
}

export async function loadActiveSchedule() {
    const response = await api.get(
        "/tasks/today"
    );

    return response.data;
}
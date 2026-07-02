import api from "./api";

export async function getSettings() {
    const response = await api.get("/settings");
    return response.data;
}

export async function updateProfile(data) {
    const response = await api.put("/settings/profile", data);
    return response.data;
}

export async function updateSettings(data) {
    const response = await api.put("/settings/preferences", data);
    return response.data;
}

export async function changePassword(data) {
    const response = await api.put("/settings/password", data);
    return response.data;
}
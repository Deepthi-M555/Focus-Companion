import api from "./api";

export async function getSchedule() {
    const response = await api.get("/schedule");
    return response.data;
}

export async function addBlock(data) {
    const response = await api.post("/schedule/block", data);
    return response.data;
}

export async function updateBlock(id, data) {
    const response = await api.put(`/schedule/block/${id}`, data);
    return response.data;
}

export async function deleteBlock(id) {
    const response = await api.delete(`/schedule/block/${id}`);
    return response.data;
}

import api from "./api";

export async function getAnalytics() {
    const { data } = await api.get("/analytics");
    return data;
}
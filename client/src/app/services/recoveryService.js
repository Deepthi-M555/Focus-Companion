import api from "./api";

export async function recoverSchedule(data) {

    const response =
        await api.post(

            "/recovery",

            data

        );

    return response.data;

}

export async function getRecoverySummary() {

    const response =
        await api.get(

            "/recovery/summary"

        );

    return response.data;

}

export async function skipAndResume() {

    const response =
        await api.post(

            "/recovery/skip"

        );

    return response.data;

}

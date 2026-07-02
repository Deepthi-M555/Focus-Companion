import api from "./api";

export async function recoverSchedule(data) {

    const response =
        await api.post(

            "/schedule/regenerate",

            data

        );

    return response.data;

}
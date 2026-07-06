import api from "./api";

export async function recoverSchedule(data) {

    const response =
        await api.post(

            "/recovery",

            data

        );

    return response.data;

}

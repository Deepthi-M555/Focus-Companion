import api from "./api";

export const saveSetup = async (data) => {

    const { data: response } =
        await api.post(
            "/setup",
            data
        );

    return response;

};

export const getSetup = async () => {

    const { data } =
        await api.get("/setup");

    return data;

};
import api from "./api";

export async function chat(message) {

    const response =
        await api.post(

            "/ai/chat",

            {
                message
            }

        );

    return response.data;
}
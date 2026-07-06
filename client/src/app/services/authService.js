import api from "./api";

const AUTH_ERROR_MESSAGES = {
    400: "Missing required fields.",
    401: "Invalid email or password.",
    404: "Account not found. Please sign up.",
    409: "Email already exists.",
    500: "Unexpected server error.",
};

export function getAuthErrorMessage(error) {
    if (!error.response) {
        return "Unable to connect. Please check your connection and try again.";
    }

    return AUTH_ERROR_MESSAGES[error.response.status] ?? "Unable to authenticate. Please try again.";
}

export async function login(data) {
    const response = await api.post("/auth/login", data);
    return response.data;
}

export async function signup(data) {
    const response = await api.post("/auth/signup", data);
    return response.data;
}

function decodeJwtPayload(token) {
    if (!token) {
        return null;
    }

    const parts = token.split(".");
    if (parts.length < 2) {
        return null;
    }

    const payload = parts[1]
        .replace(/-/g, "+")
        .replace(/_/g, "/");
    const padded = payload.padEnd(Math.ceil(payload.length / 4) * 4, "=");

    try {
        return JSON.parse(atob(padded));
    } catch {
        return null;
    }
}

export function saveToken(token) {
    sessionStorage.setItem("token", token);
}

export function getToken() {
    return sessionStorage.getItem("token");
}

export function getUserIdFromToken() {
    const payload = decodeJwtPayload(getToken());
    return payload?.userId || payload?.sub || "";
}

export function getScopedStorageKey(prefix) {
    const userId = getUserIdFromToken();
    return userId ? `${prefix}:${userId}` : prefix;
}

export function clearUserScopedClientState() {
    const keys = ["dashboardMessages", "pendingSchedule"];
    keys.forEach(key => {
        sessionStorage.removeItem(getScopedStorageKey(key));
    });
}

export function removeToken() {
    sessionStorage.removeItem("token");
}
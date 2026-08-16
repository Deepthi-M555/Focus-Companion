function decodeJwtPayload(token) {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload.padEnd(Math.ceil(payload.length / 4) * 4, "=");
    try { return JSON.parse(atob(padded)); } catch { return null; }
}

// Electron main window and overlay are separate renderer contexts.
// sessionStorage is per renderer, so the overlay cannot see the login token.
// Keep the token in origin-local storage so both windows share it and the
// login survives an Electron restart. Mirror/remove the old sessionStorage
// value for backwards compatibility.
export function saveToken(token) {
    localStorage.setItem("token", token);
    sessionStorage.setItem("token", token);
}

export function getToken() {
    const localToken = localStorage.getItem("token");
    if (localToken) return localToken;
    const sessionToken = sessionStorage.getItem("token");
    if (sessionToken) {
        localStorage.setItem("token", sessionToken);
        return sessionToken;
    }
    return null;
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
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
}

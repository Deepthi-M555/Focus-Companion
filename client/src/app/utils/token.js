function decodeJwtPayload(token) {
    if (!token) {
        return null;
    }

    const parts =
        token.split(".");

    if (parts.length < 2) {
        return null;
    }

    const payload =
        parts[1]
            .replace(/-/g, "+")
            .replace(/_/g, "/");

    const padded =
        payload.padEnd(
            Math.ceil(
                payload.length / 4
            ) * 4,
            "="
        );

    try {
        return JSON.parse(
            atob(padded)
        );
    } catch {
        return null;
    }
}


/*
 * FYNIX authentication token
 *
 * localStorage is intentionally used
 * because the Electron main window and
 * overlay are separate renderer contexts.
 *
 * The token therefore survives:
 *
 * - page reload
 * - Electron restart
 * - overlay creation
 *
 * The backend JWT currently expires
 * after 7 days.
 */

export function saveToken(token) {

    localStorage.setItem(
        "token",
        token
    );

}


export function getToken() {

    return localStorage.getItem(
        "token"
    );

}


export function getUserIdFromToken() {

    const payload =
        decodeJwtPayload(
            getToken()
        );

    return (
        payload?.userId ||
        payload?.sub ||
        ""
    );

}


export function getScopedStorageKey(
    prefix
) {

    const userId =
        getUserIdFromToken();

    return userId
        ? `${prefix}:${userId}`
        : prefix;

}


/*
 * Clear client-side data belonging
 * to the currently authenticated user.
 */

export function clearUserScopedClientState() {

    const keys = [
        "dashboardMessages",
        "pendingSchedule"
    ];

    keys.forEach(
        key => {

            localStorage.removeItem(
                getScopedStorageKey(
                    key
                )
            );

        }
    );

}


export function removeToken() {

    localStorage.removeItem(
        "token"
    );

}
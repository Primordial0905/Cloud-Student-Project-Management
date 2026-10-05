function getClientPrincipal(request) {

    const header =
        request.headers.get("x-ms-client-principal");

    if (!header) {
        return null;
    }

    try {

        const decoded =
            Buffer.from(header, "base64").toString("utf8");

        return JSON.parse(decoded);

    } catch (error) {

        console.error(
            "Failed to decode client principal:",
            error
        );

        return null;
    }
}

function requireAuthenticatedUser(request) {

    const principal =
        getClientPrincipal(request);

    if (!principal) {
        return null;
    }

    const roles =
        principal.userRoles || [];

    if (!roles.includes("authenticated")) {
        return null;
    }
    return principal;
}

module.exports = {
    getClientPrincipal,
    requireAuthenticatedUser
};
const {
    sql,
    getDatabaseConnection
} = require("./database");

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

async function getCurrentUser(request) {

    const principal =
        requireAuthenticatedUser(request);

    if (!principal) {
        return null;
    }

    const pool =
        await getDatabaseConnection();

    const result =
        await pool
            .request()
            .input(
                "githubId",
                sql.NVarChar(255),
                principal.userId
            )
            .query(`
                SELECT
                    id,
                    name,
                    email,
                    github_id,
                    created_at,
                    updated_at
                FROM Users
                WHERE github_id = @githubId
            `);

    if (result.recordset.length === 0) {
        return null;
    }

    return {
        principal,
        user: result.recordset[0]
    };
}

module.exports = {
    getClientPrincipal,
    requireAuthenticatedUser,
    getCurrentUser
};
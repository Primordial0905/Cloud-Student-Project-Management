const { NVarChar } = require("mssql");
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
        const inserted  = await pool
        .request()
        .input("githubId", sql.NVarChar(255), principal.userId)
        .input("name", sql.NVarChar(100), principal.userDetails)
        .query(`
            INSERT INTO Users (name, github_id)
            OUTPUT INSERTED.id, INSERTED.name, INSERTED.email,
                   INSERTED.github_id, INSERTED.created_at, INSERTED.updated_at
            VALUES (@name, @githubId) 
            `);
        
        return {principal, user : inserted.recordset[0]}; 
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
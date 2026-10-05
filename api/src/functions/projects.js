const { app } = require("@azure/functions");

const {
    sql,
    getDatabaseConnection
} = require("../database");

const {
    getCurrentUser
} = require("../auth");

app.http("projects", {

    methods: ["GET", "POST"],
    authLevel: "anonymous",
    route: "projects",

    handler: async (request, context) => {

        try {

            const currentUser =
                await getCurrentUser(request);

            if (!currentUser) {
                return {
                    status: 401,
                    jsonBody: {
                        success: false,
                        message: "Authentication required"
                    }
                };
            }

            const pool =
                await getDatabaseConnection();

            if (request.method === "GET") {

                const result =
                    await pool
                        .request()
                        .input(
                            "ownerId",
                            sql.Int,
                            currentUser.user.id
                        )
                        .query(`
                            SELECT
                                id,
                                name,
                                description,
                                owner_id,
                                created_at,
                                updated_at
                            FROM Projects
                            WHERE owner_id = @ownerId
                            ORDER BY created_at DESC
                        `);

                return {
                    status: 200,
                    jsonBody: {
                        success: true,
                        projects: result.recordset
                    }
                };
            }

            if (request.method === "POST") {

                const body =
                    await request.json();

                if (
                    !body.name ||
                    !body.name.trim()
                ) {
                    return {
                        status: 400,
                        jsonBody: {
                            success: false,
                            message: "Project name is required"
                        }
                    };
                }

                const result =
                    await pool
                        .request()
                        .input(
                            "name",
                            sql.NVarChar(150),
                            body.name.trim()
                        )
                        .input(
                            "description",
                            sql.NVarChar(sql.MAX),
                            body.description || null
                        )
                        .input(
                            "ownerId",
                            sql.Int,
                            currentUser.user.id
                        )
                        .query(`
                            INSERT INTO Projects
                            (
                                name,
                                description,
                                owner_id
                            )

                            OUTPUT
                                INSERTED.id,
                                INSERTED.name,
                                INSERTED.description,
                                INSERTED.owner_id,
                                INSERTED.created_at,
                                INSERTED.updated_at

                            VALUES
                            (
                                @name,
                                @description,
                                @ownerId
                            )
                        `);

                return {
                    status: 201,
                    jsonBody: {
                        success: true,
                        message:
                            "Project created successfully",
                        project:
                            result.recordset[0]
                    }
                };
            }

            return {
                status: 405,
                jsonBody: {
                    success: false,
                    message: "Method not allowed"
                }
            };


        } catch (error) {

            context.error(
                "Projects API error:",
                error
            );

            return {
                status: 500,
                jsonBody: {
                    success: false,
                    message: "Internal server error"
                }
            };
        }
    }
});
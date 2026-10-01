const { app } = require("@azure/functions");
const dns = require("dns").promises;
const net = require("net");

app.http("db-test", {
    methods: ["GET"],
    authLevel: "anonymous",
    handler: async (request, context) => {

        const host = process.env.SQL_Server;
        const port = 1433;

        try {
            const dnsResult = await dns.lookup(host);

            const tcpResult = await new Promise((resolve) => {
                const socket = new net.Socket();

                socket.setTimeout(10000);

                socket.on("connect", () => {
                    socket.destroy();
                    resolve({
                        success: true,
                        message: "TCP connection successful"
                    });
                });

                socket.on("timeout", () => {
                    socket.destroy();
                    resolve({
                        success: false,
                        message: "TCP connection timeout"
                    });
                });

                socket.on("error", (error) => {
                    socket.destroy();
                    resolve({
                        success: false,
                        message: error.message,
                        code: error.code
                    });
                });

                socket.connect(port, host);
            });

            return {
                status: 200,
                jsonBody: {
                    host,
                    dns: dnsResult,
                    tcp: tcpResult
                }
            };

        } catch (error) {
            return {
                status: 500,
                jsonBody: {
                    success: false,
                    error: error.message,
                    code: error.code
                }
            };
        }
    }
});
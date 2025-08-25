import swaggerAutogen from "swagger-autogen";
import swaggerUiExpress from "swagger-ui-express";
export const setupSwagger = (app) => {
    app.use(
        "/docs",
        swaggerUiExpress.serve,
        swaggerUiExpress.setup({}, {
            swaggerOptions: {
                url: "/openapi.json",
            },
        })
    );
    app.get("/openapi.json", async (req, res, next) => {
        // #swagger.ignore = true
        const options = {
            openapi: "3.0.0",
            disableLogs: true,
            writeOutputFile: false,
        };
        const outputFile = "/dev/null"; // 파일 출력은 사용하지 않습니다.
        const routes = ["./src/index.js"];
        const doc = {
            info: {
                title: process.env.SWAGGER_TITLE,
                description: process.env.SWAGGER_DESCRIPTION,
            },
            host: process.env.SWAGGER_HOST,
        };

        const result = await swaggerAutogen(options)(outputFile, routes, doc);
        res.json(result ? result.data : null);
    });
}
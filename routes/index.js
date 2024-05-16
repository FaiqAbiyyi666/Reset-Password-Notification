const express = require("express");
const router = express.Router();
const swaggerUI = require("swagger-ui-express");
const YAML = require("yaml");
const fs = require("fs");
const path = require("path");

const user = require("./user.routes");

// const swagger_path = path.resolve(__dirname, "../api-docs.yaml");
// const file = fs.readFileSync(swagger_path, "utf-8");

// // Docs API
// const swaggerDocument = YAML.parse(file);
// router.use(
//   "/api/v1/api-docs",
//   swaggerUI.serve,
//   swaggerUI.setup(swaggerDocument)
// );

// API
router.use("/api/v1", user);

module.exports = router;

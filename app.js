require("dotenv").config();
const Sentry = require("./libs/sentry");
const express = require("express");
const logger = require("morgan");
const app = express();
const cors = require("cors");
const routes = require("./routes");
const server = require("http").createServer(app);
global.io = require("socket.io")(server);

// app.use(Sentry.Handlers.requestHandler());
// app.use(Sentry.Handlers.tracingHandler());

app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(routes);

global.io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

app.get("/", (req, res) =>
  res.json({ status: true, message: "Challenge-7!", data: null })
);

Sentry.setupExpressErrorHandler(app);
// app.use(Sentry.Handlers.errorHandler());

// 500 error handler
app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).json({
    status: false,
    message: err.message,
    data: null,
  });
});

// 404 error handler
app.use((req, res, next) => {
  res.status(404).json({
    status: false,
    message: `are you lost? ${req.method} ${req.url} is not registered!`,
    data: null,
  });
});

module.exports = app;

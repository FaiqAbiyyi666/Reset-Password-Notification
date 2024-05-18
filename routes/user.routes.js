const router = require("express").Router();
const {
  register,
  login,
  auth,
  index,
  show,
  update,
  destroy,
  forgotPsw,
  resetPsw,
  loginPage,
  forgotPswPage,
  resetPswPage,
  notifPage,
} = require("../controllers/user.controllers");
const restrict = require("../middlewares/auth.middlewares");

// Auth API
router.post("/auth/register", register);
router.post("/auth/login", login);
router.get("/auth/authenticate", restrict, auth);

// User API
router.get("/users", index);
router.get("/users/:id", show);
router.put("/users/:id/profile", restrict, update);
router.delete("/users/:id", restrict, destroy);

// Forgot Password API
router.post("/forgot-password", forgotPsw);
router.post("/reset-password", resetPsw);

// Page API
router.get("/login", loginPage);
router.get("/forgot-password", forgotPswPage);
router.get("/reset-password", resetPswPage);
router.get("/users/:id/notification", notifPage);

module.exports = router;

const router = require("express").Router();
const {
  register,
  login,
  auth,
  index,
  show,
  update,
  destroy,
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

module.exports = router;

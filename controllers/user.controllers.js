const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { JWT_SECRET_KEY } = process.env;
const { getHTML, sendMail } = require("../libs/nodemailer");
const { dateFormatted } = require("../libs/dateFormatted");

module.exports = {
  register: async (req, res, next) => {
    try {
      let { username, email, password } = req.body;
      let exist = await prisma.user.findUnique({ where: { email } });

      if (!username || !email || !password) {
        return res.status(400).json({
          status: false,
          message: "Input must be required",
          data: null,
        });
      } else if (exist) {
        return res.status(401).json({
          status: false,
          message: "Email already used!",
        });
      }

      let encryptedPassword = await bcrypt.hash(password, 10);

      let user = await prisma.user.create({
        data: {
          username,
          email,
          password: encryptedPassword,
        },
      });

      delete user.password;

      const notification = await prisma.notification.create({
        data: {
          title: "Success Register",
          body: "Akun berhasil dibuat!",
          createdDate: dateFormatted(new Date()),
          user: { connect: { id: user.id } },
        },
      });

      global.io.emit(`user-${user.id}`, notification);

      return res.status(200).json({
        status: true,
        message: "OK",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  login: async (req, res, next) => {
    try {
      let { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({
          status: false,
          message: "Email and password are required!",
          data: null,
        });
      }

      let user = await prisma.user.findFirst({ where: { email } });
      if (!user) {
        return res.status(400).json({
          status: false,
          message: "Invalid email or password!",
          data: null,
        });
      }

      let isPassCorrect = await bcrypt.compare(password, user.password);
      if (!isPassCorrect) {
        return res.status(400).json({
          status: false,
          message: "Invalid email or password!",
          data: null,
        });
      }

      delete user.password;

      let token = jwt.sign(user, JWT_SECRET_KEY);

      const notification = await prisma.notification.create({
        data: {
          title: "Success Login!",
          body: `Hi ${user.username}, Welcome to the Jungle!`,
          createdDate: dateFormatted(new Date()),
          user: { connect: { id: user.id } },
        },
      });

      global.io.emit(`user-${user.id}`, notification);

      return res.status(201).json({
        status: true,
        message: "OK",
        data: { ...user, token },
      });
    } catch (error) {
      next(error);
    }
  },

  auth: async (req, res, next) => {
    try {
      const user = req.user;

      return res.status(200).json({
        status: true,
        message: "OK",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  index: async (req, res, next) => {
    try {
      let { search } = req.query;

      let users = await prisma.user.findMany({
        where: {
          username: { contains: search, mode: "insensitive" },
        },
      });

      users.forEach((user) => {
        delete user.password;
      });

      res.status(200).json({
        status: true,
        message: "OK",
        data: users,
      });
    } catch (error) {
      next(error);
    }
  },

  show: async (req, res, next) => {
    try {
      let id = Number(req.params.id);

      let user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        return res.status(400).json({
          status: false,
          message: "Can't find user with id " + id,
          data: null,
        });
      }

      delete user.password;

      res.status(200).json({
        status: true,
        message: "OK",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      let id = Number(req.params.id);

      let exist = await prisma.user.findUnique({
        where: { id },
      });

      if (!exist) {
        return res.status(400).json({
          status: false,
          message: "Can't find user with id " + id,
          data: null,
        });
      }

      let { username } = req.body;

      if (!username) {
        return res.status(400).json({
          status: false,
          message:
            "At least one piece of data needs to be provided for the update to occur.",
          data: null,
        });
      }

      const user = await prisma.user.update({
        where: { id },
        data: {
          username,
        },
      });

      delete user.password;

      res.status(200).json({
        status: true,
        message: "User updated success",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  destroy: async (req, res, next) => {
    try {
      let id = Number(req.params.id);

      let exist = await prisma.user.findUnique({
        where: { id },
      });

      if (!exist) {
        return res.status(400).json({
          status: false,
          message: "Can't find user with id " + id,
          data: null,
        });
      }

      await prisma.user.delete({
        where: { id },
      });

      res.status(200).json({
        status: true,
        message: "The user have been successfully deleted",
      });
    } catch (error) {
      next(error);
    }
  },

  forgotPsw: async (req, res, next) => {
    try {
      const { email } = req.body;
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        return res.status(404).json({
          status: false,
          message: "Email tidak terdaftar",
          data: null,
        });
      }
      let token = jwt.sign({ email: user.email }, JWT_SECRET_KEY);

      let url = `${req.protocol}://${req.get(
        "host"
      )}/api/v1/reset-password?token=${token}`;

      console.log(url);

      let html = await getHTML("set-new-password.ejs", {
        name: user.username,
        token: token,
        url: url,
      });

      await sendMail(email, "Forgot Password", html);

      return res.status(200).json({
        status: true,
        message: "Success send email",
        data: null,
      });
    } catch (error) {
      next(error);
    }
  },

  resetPsw: async (req, res, next) => {
    try {
      const { token } = req.query;
      const { password, passwordConfirmation } = req.body;

      if (!password || !passwordConfirmation) {
        return res.status(400).json({
          status: false,
          message: "Password confirmation are required!",
          data: null,
        });
      }

      if (password !== passwordConfirmation) {
        return res.status(401).json({
          status: false,
          message: "Ensure the password and confirmation match!",
          data: null,
        });
      }

      let encryptedPassword = await bcrypt.hash(password, 10);

      jwt.verify(token, JWT_SECRET_KEY, async (err, decoded) => {
        if (err) {
          return res.status(403).json({
            status: false,
            message: "Invalid or expired token!",
            data: null,
          });
        }

        const updateUser = await prisma.user.update({
          where: { email: decoded.email },
          data: { password: encryptedPassword },
          select: { id: true, username: true, email: true },
        });

        res.status(200).json({
          status: true,
          message: "Your password has been updated successfully!",
          data: updateUser,
        });
      });
    } catch (error) {
      next(error);
    }
  },

  loginPage: async (req, res, next) => {
    try {
      res.render("./templates/login.ejs");
    } catch (error) {
      next(error);
    }
  },
  forgotPswPage: async (req, res, next) => {
    try {
      res.render("./templates/lupa-password.ejs");
    } catch (error) {
      next(error);
    }
  },
  resetPswPage: async (req, res, next) => {
    try {
      let { token } = req.query;
      res.render("./templates/set-new-password.ejs", { token });
    } catch (error) {
      next(error);
    }
  },
  notifPage: async (req, res, next) => {
    try {
      const userId = Number(req.params.id);
      const notifications = await prisma.notification.findMany({
        where: { user_id: userId },
      });
      res.render("notification.ejs", {
        userID: userId,
        notifications: notifications,
      });
    } catch (error) {
      next(error);
    }
  },
};

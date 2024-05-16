const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { JWT_SECRET_KEY } = process.env;
const dotenv = require("dotenv");
dotenv.config();

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
};

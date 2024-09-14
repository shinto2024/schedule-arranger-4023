const { Hono } = require("hono");
const ensureAuthenticated = require("../middlewares/ensure-authenticated");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({ log: ["query"] });
const { z } = require("zod");
const { zValidator } = require("@hono/zod-validator");

const app = new Hono()

const paramValidator = zValidator(
  "param",
  z.object({
    userId: z.coerce.number().int().min(0),
  }),
  (result) => {
    if (!result.success) {
      return c.json({
        status: "NG",
        errors: [result.error],
      }, 400);
    }
  }
);

const jsonValidator = zValidator(
  "json",
  z.object({
    colorMode: z.enum(["light", "dark"]),
  }),
  (result) => {
    if (!result.success) {
      return c.json({
        status: "NG",
        errors: [result.error],
      }, 400);
    }
  }
);

app.post(
  "/users/:userId/",
  ensureAuthenticated(),
  paramValidator,
  jsonValidator,
  async (c) => {
    const { userId } = c.req.valid("param");
    const { colorMode } = c.req.valid("json");

    const { user } = c.get("session") ?? {};
    if (user?.id !== userId) {
      return c.json({
        status: "NG",
        errors: [{ msg: "ユーザー ID が不正です。"}],
      }, 403);
    }
    // TODO この先のDBに保存する処理の記述
  }
)

const { Hono } = require("hono");
const { html } = require("hono/html");
const layout = require("../layout");
const ensureAuthenticated = require("../middlewares/ensure-authenticated");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({ log: ["query"] });
const { z } = require("zod");
const { zValidator } = require("@hono/zod-validator");
const { HTTPException } = require("hono/http-exception");

const app = new Hono()

const formValidator = zValidator(
  "form",
  z.object({
    colorMode: z.enum(["light", "dark"]),
  }),
  (result) => {
    if (!result.success) {
      throw new HTTPException(400, { message: "入力された情報が不十分または正しくありません" });
    }
  }
);

app.post(
  "/",
  ensureAuthenticated(),
  formValidator,
  async (c) => {
    const { user } = c.get("session") ?? {};
    const { colorMode } = c.req.valid("form");

    const data = {
      userId: user.id,
      colorMode,
    }

    try {
      await prisma.setting.upsert({
        where: { userId: user.id },
        update: data,
        create: data,
      });
    } catch (error) {
      console.error(error);
      throw new HTTPException(400, { message: "入力された情報が不十分または正しくありません" });
    }

    return c.redirect("/"); // TODO 元いたページにリダイレクトするようにする
  }
);

app.get(
  "/", ensureAuthenticated(), (c) => {
    return c.html(
      layout(
        c,
        "設定",
        html`
          <form method="post" action="/settings" class="my-3">
              <h3 class="my-4">設定</h3>
              <div class="mb-3">
                  <label class="form-label">カラーモード</label>
                  <div class="form-check mb-1">
                      <input type="radio" name="colorMode" id="colorModeLight" value="light" class="form-check-input">
                      <label for="colorModeLight">
                          ライト (light)
                      </label>
                  </div>
                  <div class="form-check">
                      <input type="radio" name="colorMode" id="colorModeDark" value="dark" class="form-check-input">
                      <label for="colorModeDark">
                          ダーク (dark)
                      </label>
                  </div>
              </div>
              <div class="mb-3">
                <button class="btn btn-primary" type="submit">設定を保存</button>
                </div>
          </form>
        `,
      ),
    );
  }
);


module.exports = app;

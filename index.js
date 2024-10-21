const Express = require("express");
const app = Express();
const loginRouter = require("./routers/loginRouter");

app.use("/", (req, res) => {
  res.send("Hello World");
});

app.listen(3000);

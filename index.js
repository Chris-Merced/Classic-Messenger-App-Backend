const Express = require("express");
const app = Express();
const loginRouter = require("./routers/loginRouter");

app.use("/login", loginRouter);

app.listen(3000, console.log("We're Listening"));


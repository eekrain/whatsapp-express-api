import express, { Express, Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import fs from "fs";
import { Client, LocalAuth, NoAuth } from "whatsapp-web.js";
import authRoute from "./routes/auth";
import chatRoute from "./routes/chat";
import bodyParser from "body-parser";
import rimraf from "rimraf";

dotenv.config();

global.waClientStatus = {
  isAuthenticated: false,
  isClientReady: false,
  qrReady: false,
};

export const waclient = new Client({
  puppeteer: { args: ["--no-sandbox", "--disable-setuid-sandbox"] },
  restartOnAuthFail: true, // related problem solution
  authStrategy: new LocalAuth(),
});

waclient.on("qr", (qr: any) => {
  global.waClientStatus = { ...global.waClientStatus, qrReady: true };
  console.log("QR RECEIVED", qr);
  fs.writeFileSync("./latest.qr", qr);
});

waclient.on("authenticated", () => {
  global.waClientStatus = { ...global.waClientStatus, isAuthenticated: true };

  console.log("AUTH!");

  console.log("deleting latest.qr");
  rimraf("./latest.qr", (err) => {
    if (err)
      console.log(
        "fail deleting latest.qr on authenticated, probably already deleted",
        err
      );
  });
});

waclient.on("disconnected", (reason) => {
  console.log("CLIENT DISCONNECTED", reason);
  // Destroy and reinitialize the client when disconnected
  global.waClientStatus = {
    isAuthenticated: false,
    isClientReady: false,
    qrReady: false,
  };
  waclient.destroy();
  waclient.initialize();
});

waclient.on("auth_failure", () => {
  global.waClientStatus = { ...global.waClientStatus, isAuthenticated: false };

  console.log("AUTH Failed !");
  // process.exit();
});

waclient.on("ready", () => {
  global.waClientStatus = { ...global.waClientStatus, isClientReady: true };
  console.log("Client is ready!");
});

waclient.initialize();

const app: Express = express();
const port = process.env.PORT || 5000;
console.log("🚀 ~ file: index.ts ~ line 60 ~ port", port);

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(req.method + " : " + req.path);
  const secret = req.headers?.["x-mywa-secret"];
  if (secret === process.env.WHATSAPP_API_SECRET) {
    return next();
  }
  res.status(400).send("Bad Request");
});

app.use("/auth", authRoute);
app.use("/chat", chatRoute);

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
  console.log(
    `⚡️[server]: Check auth status http://localhost:${port}/auth/getauthstatus`
  );
});

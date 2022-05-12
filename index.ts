import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import fs from "fs";
import { Client, NoAuth } from "whatsapp-web.js";
import authRoute from "./routes/auth";
import bodyParser from "body-parser";

dotenv.config();

global.waClientStatus = {
  isAuthenticated: false,
  isClientReady: false,
  qrReady: false,
};

export const waclient = new Client({
  puppeteer: { args: ["--no-sandbox", "--disable-setuid-sandbox"] },
  authStrategy: new NoAuth(),
});

waclient.on("qr", (qr: any) => {
  global.waClientStatus = { ...global.waClientStatus, qrReady: true };
  console.log("QR RECEIVED", qr);
  fs.writeFileSync("./latest.qr", qr);
});

waclient.on("authenticated", () => {
  global.waClientStatus = { ...global.waClientStatus, isAuthenticated: true };

  console.log("AUTH!");

  try {
    fs.unlinkSync("latest.qr");
    console.log("success deleting latest.qr on authenticated");
  } catch (err) {
    console.log("fail deleting latest.qr on authenticated", err);
  }
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
const port = process.env.PORT;

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});

app.use("/auth", authRoute);

const backend = app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${port}`);
});

enum Signals {
  SIGHUP = 1,
  SIGINT = 2,
  SIGTERM = 15,
}

type SignalsKey = keyof typeof Signals;

const shutdown = (signal: string, value: number) => {
  console.log(`${signal} / ${value} signal received: closing all server`);
  try {
    fs.unlinkSync("latest.qr");
    console.log("success deleting latest.qr on SIGTERM");
  } catch (err) {
    console.log("fail deleting latest.qr on SIGTERM", err);
  }
  waclient.destroy();
  console.log("Wweb destroyed");
  backend.close(() => {
    console.log("Express backend server closed");
  });
};

Object.keys(Signals).map((signal) => {
  process.on(signal, () => {
    console.log(`process received a ${signal} signal`);
    shutdown(signal, Signals[signal as SignalsKey]);
  });
});

import express, { Express, Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import fs from "fs";
import { Client, LocalAuth, NoAuth } from "whatsapp-web.js";
import authRoute from "./routes/auth";
import chatRoute from "./routes/chat";
import bodyParser from "body-parser";
import rimraf from "rimraf";
import { sendNotification } from "./utils/sendNotification";
import { getWhatsappAPISubsribeStatus } from "./utils/getWhatsappAPISubsribeStatus";

dotenv.config();

global.waClientStatus = {
  isAuthenticated: false,
  isClientReady: false,
  qrReady: false,
};

const withFCMNotif = process.env.WITH_FCM_NOTIFICATION === "true";

export const waclient = new Client({
  puppeteer: { args: ["--no-sandbox", "--disable-setuid-sandbox"] },
  restartOnAuthFail: true, // related problem solution
  authStrategy: new LocalAuth(),
});

waclient.on("qr", (qr: any) => {
  global.waClientStatus = { ...global.waClientStatus, qrReady: true };
  console.log("QR RECEIVED", qr);
  fs.writeFileSync("./latest.qr", qr);

  const sendNotif = async () => {
    try {
      await sendNotification({
        title: "Akun Whatsapp Offline",
        body: "API Whatsapp Web tidak mendapatkan session akun Whatsapp. Segera login untuk handle notifikasi pengiriman nota!",
      });
    } catch (error) {
      console.log("🚀 ~ file: index.ts ~ line 42 ~ send ~ error", error);
    }
  };
  if (withFCMNotif) sendNotif();
});

waclient.on("authenticated", () => {
  console.log("AUTHENTICATED!");
  global.waClientStatus = { ...global.waClientStatus, isAuthenticated: true };

  console.log("deleting latest.qr");
  rimraf("./latest.qr", (err) => {
    if (err)
      console.log(
        "fail deleting latest.qr on authenticated, probably already deleted",
        err
      );
  });

  const sendNotif = async () => {
    const { isSubscribed } = await getWhatsappAPISubsribeStatus();

    try {
      if (isSubscribed) {
        await sendNotification({
          title: "Akun Whatsapp Online",
          body: "Notifikasi pembelian transaksi akan dihandle.",
        });
      } else {
        await sendNotification({
          title: "Akun Whatsapp Offline",
          body: "Langganan API Whatsapp Web habis. Notifikasi pembelian transaksi akan dihandle. Segera perpanjang untuk handle notifikasi pengiriman nota.",
        });
      }
    } catch (error) {
      console.log("🚀 ~ file: index.ts ~ line 42 ~ send ~ error", error);
    }
  };
  if (withFCMNotif) sendNotif();
});

waclient.on("disconnected", (reason) => {
  console.log("CLIENT DISCONNECTED", reason);
  // Destroy and reinitialize the client when disconnected
  global.waClientStatus = {
    isAuthenticated: false,
    isClientReady: false,
    qrReady: false,
  };

  const sendNotif = async () => {
    try {
      await sendNotification({
        title: "Akun Whatsapp Offline",
        body: "Segera login kembali. Notifikasi pembelian transaksi tidak akan dapat terkirim!",
      });

      await waclient.destroy();
      await waclient.initialize();
    } catch (error) {
      console.log("🚀 ~ file: index.ts ~ line 58 ~ waclient.on ~ error", error);
    }
  };
  if (withFCMNotif) sendNotif();
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

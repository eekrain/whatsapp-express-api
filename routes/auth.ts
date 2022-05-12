import { Router, Request, Response } from "express";
import { shutdown, waclient, Signals } from "..";
import fs from "fs/promises";
import to from "await-to-js";
import { WAState, ClientInfo } from "whatsapp-web.js";

const router = Router();

router.get("/signout", async (req, res) => {
  await waclient.destroy().catch((err) => {
    console.log(
      "🚀 ~ file: auth.ts ~ line 11 ~ awaitwaclient.destroy ~ err",
      err
    );
  });
  res.send("ok");
  shutdown("SIGTERM", Signals.SIGTERM);
});

interface GetAuthStatusOutput {
  is_authenticated: boolean;
  is_qr_ready: boolean;
  is_client_ready: boolean;
  state: WAState;
  qrcode?: string;
  info?: ClientInfo;
}

router.get("/getauthstatus", async (req, res) => {
  const [errWaclient, waState] = await to(waclient.getState());
  console.log("🚀 ~ file: auth.ts ~ line 31 ~ router.get ~ waState", waState);
  const waInfo = waclient.info;
  const [errQr, qr] = await to(fs.readFile("latest.qr", "utf8"));
  const waRunningStatus = global.waClientStatus;

  if (
    errWaclient ||
    !waState ||
    waState === WAState.UNLAUNCHED ||
    waRunningStatus.isAuthenticated === false ||
    waRunningStatus.isClientReady === false
  ) {
    const output: GetAuthStatusOutput = {
      is_authenticated: waRunningStatus.isAuthenticated,
      is_qr_ready: waRunningStatus.qrReady,
      is_client_ready: waRunningStatus.isClientReady,
      state: WAState.UNLAUNCHED,
      info: waInfo,
      qrcode: qr,
    };
    return res.send(output);
  }

  const output: GetAuthStatusOutput = {
    is_authenticated: waRunningStatus.isAuthenticated,
    is_qr_ready: waRunningStatus.qrReady,
    is_client_ready: waRunningStatus.isClientReady,
    state: waState,
    info: waInfo,
  };

  return res.send(output);
});

export default router;

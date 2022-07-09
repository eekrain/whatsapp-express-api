import { Router, Request, Response } from "express";
import { waclient } from "..";
import fs from "fs/promises";
import to from "await-to-js";
import { WAState, ClientInfo } from "whatsapp-web.js";

const router = Router();

router.get("/signout", async (req, res) => {
  const [errSignout, _] = await to(waclient.logout());
  if (errSignout) {
    console.log(
      "🚀 ~ file: auth.ts ~ line 12 ~ router.get ~ errSignout",
      errSignout
    );
    return res.status(500).send(errSignout.message || "Something went wrong");
  } else {
    return res.send({ is_success: true });
  }
});

interface GetAuthStatusOutput {
  is_authenticated: boolean;
  is_qr_ready: boolean;
  is_client_ready: boolean;
  state: string;
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
    waRunningStatus.isAuthenticated === false ||
    waRunningStatus.isClientReady === false
  ) {
    const output: GetAuthStatusOutput = {
      is_authenticated: waRunningStatus.isAuthenticated,
      is_qr_ready: waRunningStatus.qrReady,
      is_client_ready: waRunningStatus.isClientReady,
      state: waState || "",
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

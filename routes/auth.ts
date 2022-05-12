import { Router, Request, Response } from "express";
import { waclient } from "..";
import fs from "fs";

const router = Router();

router.get("/waclientstatus", async (req, res) => {
  return res.send(global.waClientStatus);
});

router.get("/signout", async (req, res) => {
  waclient.destroy();
  res.send("ok");
  process.exit();
});

router.get("/getqr", async (req, res) => {
  waclient
    .getState()
    .then((data) => {
      console.log("🚀 ~ file: auth.ts ~ line 10 ~ .then ~ data", data);
      if (data) {
        res.write("<html><body><h2>Already Authenticated</h2></body></html>");
        res.end();
      } else sendWebQr(res);
    })
    .catch((error) => {
      console.log("🚀 ~ file: auth.ts ~ line 16 ~ router.get ~ error", error);
    });
});

function sendWebQr(res: Response) {
  fs.readFile("latest.qr", (err, latest_qr) => {
    console.log("🚀 ~ file: auth.ts ~ line 24 ~ fs.readFile ~ err", err);
    if (!err && latest_qr) {
      var page = `
                    <html>
                        <body>
                            <script type="module">
                            </script>
                            <div id="qrcode"></div>
                            <script type="module">
                                import QrCreator from "https://cdn.jsdelivr.net/npm/qr-creator/dist/qr-creator.es6.min.js";
                                let container = document.getElementById("qrcode");
                                QrCreator.render({
                                    text: "${latest_qr}",
                                    radius: 0.5, // 0.0 to 0.5
                                    ecLevel: "H", // L, M, Q, H
                                    fill: "#000000", // foreground color
                                    background: null, // color or null for transparent
                                    size: 256, // in pixels
                                }, container);
                            </script>
                        </body>
                    </html>
                `;
      res.write(page);
      res.end();
    }
  });
}

export default router;

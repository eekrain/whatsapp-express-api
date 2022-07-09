import axios from "axios";
import { Router, Request, Response } from "express";
import { MessageMedia } from "whatsapp-web.js";
import { waclient } from "..";
import fs from "fs";
import vuri from "valid-url";
import { Stream } from "stream";
import rimraf from "rimraf";

const router = Router();

const mediadownloader = async (
  url: string,
  path: string,
  callback: () => void
) => {
  axios
    .head(url)
    .then(() => {
      axios
        .get<Stream>(url, {
          method: "GET",
          responseType: "stream",
        })
        .then((res) => {
          res.data.pipe(fs.createWriteStream(path)).on("close", callback);
        });
    })
    .catch((err) => {
      console.log("🚀 ~ file: chat.ts ~ line 11 ~ axios.head ~ err", err);
    });
};

router.post("/sendmessage/:phone", async (req, res) => {
  let phone = req.params.phone;
  let message = req.body.message;

  if (phone == undefined || message == undefined) {
    return res.send({
      isError: true,
      errorMessage: "Please enter valid phone and message",
    });
  } else {
    waclient.sendMessage(phone + "@c.us", message).then((response) => {
      if (response.id.fromMe) {
        return res.send({
          isError: false,
        });
      }
    });
  }
});

router.post("/sendimage/:phone", async (req, res) => {
  var base64regex =
    /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;

  let phone = req.params.phone;
  let image = req.body.image;
  let caption = req.body.caption;

  if (phone == undefined || image == undefined) {
    res.send({
      isError: true,
      errorMessage: "Please enter valid phone and base64/url of image",
    });
  } else {
    if (base64regex.test(image)) {
      let media = new MessageMedia("image/png", image);
      waclient
        .sendMessage(`${phone}@c.us`, media, { caption: caption || "" })
        .then((response) => {
          if (response.id.fromMe) {
            res.send({
              isError: false,
            });
          }
        });
    } else if (vuri.isWebUri(image)) {
      if (!fs.existsSync("./temp")) {
        await fs.mkdirSync("./temp");
      }

      var path = "./temp/" + image.split("/").slice(-1)[0];
      mediadownloader(image, path, () => {
        let media = MessageMedia.fromFilePath(path);

        waclient
          .sendMessage(`${phone}@c.us`, media, { caption: caption || "" })
          .then((response) => {
            if (response.id.fromMe) {
              res.send({
                isError: false,
              });
              rimraf(path, (err) => {
                if (err)
                  console.log(
                    "🚀 ~ file: chat.ts ~ line 95 ~ rimraf ~ err",
                    err
                  );
              });
            }
          });
      });
    } else {
      res.send({
        isError: true,
        errorMessage: "Invalid URL/Base64 Encoded Media",
      });
    }
  }
});

export default router;

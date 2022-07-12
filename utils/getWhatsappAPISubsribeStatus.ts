import to from "await-to-js";
import dayjs from "dayjs";
import { getAdminSdk } from "./graphqlClient";

export const getWhatsappAPISubsribeStatus = async () => {
  const sdk = getAdminSdk();
  const [errSubs, resSubs] = await to(
    sdk.Whatsapp_GetLastWhatsappSubscription()
  );
  if (errSubs || !resSubs) {
    console.log(
      "🚀 ~ file: Transaction_SendReceipt.ts ~ line 37 ~ errSubs",
      errSubs
    );
  }

  let title = "";
  let body = "";

  let isSubscribed = false;
  const subUntil = resSubs?.data?.whatsapp_subscription?.[0]?.until;
  if (subUntil && dayjs(subUntil).isAfter(dayjs())) isSubscribed = true;

  return { isSubscribed };
};

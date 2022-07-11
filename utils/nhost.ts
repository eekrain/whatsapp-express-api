import { NhostClient } from "@nhost/nhost-js";

export const getNhostConfig = () => {
  return {
    NHOST_ADMIN_SECRET: process.env.NHOST_ADMIN_SECRET || "",
    NHOST_BACKEND_URL: process.env.NHOST_BACKEND_URL || "",
  };
};

export const nhost = new NhostClient({
  backendUrl: getNhostConfig().NHOST_BACKEND_URL,
  adminSecret: getNhostConfig().NHOST_ADMIN_SECRET,
});

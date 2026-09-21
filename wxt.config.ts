import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "NKG Want List Plus",
    description:
      "Group and reorder items on your Noble Knight Games want list.",
    permissions: ["storage"],
    host_permissions: ["*://www.nobleknight.com/*"],
  },
});

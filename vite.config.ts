import { defineConfig } from "vite";

export default defineConfig({
  root: "out",
  server: {
    port: 3123,
    open: false,
    watch: {
      ignored: ["out/config/**"],
    },
  },
  build: {
    emptyOutDir: false,
  },
});

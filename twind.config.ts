import { Options } from "$fresh/plugins/twind.ts";
import { defineConfig } from "twind";

export default {
  selfURL: import.meta.url,
  ...defineConfig({
    theme: { extend: {} },
  }),
} as Options;

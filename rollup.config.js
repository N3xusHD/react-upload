import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import typescriptPlugin from "@rollup/plugin-typescript";
import typescript from "typescript";
import metablock from "rollup-plugin-userscript-metablock";
import { terser } from "rollup-plugin-terser";
import json from "@rollup/plugin-json";

const path = require("path");
const fs = require("fs");
const pkg = require("./package.json");

const globals = {
  react: "React",
  "react-dom": "ReactDOM",
  [path.resolve(__dirname, "src/utils/media-info-lib")]: "MediaInfoLib",
  "parse-torrent": "parseTorrent",
  "parse-torrent-title": "ptt",
  jszip: "JSZip",
  "browser-fs-access": "BFSA",
  "@ffmpeg/ffmpeg": "FFmpeg",
  "@ramonak/react-progress-bar": "ProgressBar",
  fflate: "fflate",
  "create-torrent": "createTorrent",
};

const banner = () =>
  "\n/*\n" +
  fs.readFileSync("./LICENSE", "utf8") +
  `*/\n\n/* globals ${Object.entries(globals)
    .map((e) => e[1])
    .join(", ")} */`;

fs.mkdir("dist/", { recursive: true }, () => null);

export default {
  input: "src/index.js",
  output: {
    file: `dist/${
      process.env.release ? `release-${pkg.version}` : "bundle.min"
    }.user.js`,
    format: "iife",
    name: "rollupUserScript",
    banner: banner,
    sourcemap: !process.env.release,
    globals: globals,
    plugins: process.env.release ? [] : [terser()],
  },

  plugins: [
    replace({
      "process.env.NODE_ENV": JSON.stringify("production"),
      ENVIRONMENT: JSON.stringify("production"),
      preventAssignment: true,
    }),
    nodeResolve({ extensions: [".js", ".ts", ".tsx"] }),
    typescriptPlugin({ typescript }),
    commonjs({
      include: ["node_modules/**"],
      exclude: ["node_modules/process-es6/**"],
    }),
    babel({ babelHelpers: "bundled" }),
    metablock({
      file: "./meta.json",
      override: {
        name: pkg.name,
        version: pkg.version,
        description: pkg.description,
        homepage: pkg.homepage,
        author: pkg.author,
        license: pkg.license,
      },
    }),
    json(),
  ],
  external: (id) => {
    return [...Object.keys(globals)].some(
      (e) => path.basename(e) === path.basename(id, path.extname(id))
    );
  },
};

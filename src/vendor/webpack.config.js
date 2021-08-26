const webpack = require("webpack");
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");

const path = require("path");
const fs = require("fs");

const entriesDir = path.resolve(__dirname, "entries");
const globals = {
  //react: "React",
  //"react-dom": "ReactDOM",
  //[path.resolve(__dirname, "src/utils/media-info-lib")]: "MediaInfoLib",
  "parse-torrent": "parseTorrent",
  "parse-torrent-title": "ptt",
  "browser-fs-access": "BFSA",
  "@ramonak/react-progress-bar": "ProgressBar",
  fflate: "fflate",
  "create-torrent": "createTorrent",
};

const externals = {
  react: "React",
  "react-dom": "ReactDOM",
};

const directory = path.resolve(__dirname, `entries`);

for (const file of fs.readdirSync(directory)) {
  fs.unlinkSync(path.join(directory, file));
}

for (let key in globals) {
  if (key in externals) {
    continue;
  } else {
    const name = globals[key];
    const source = key.replace(/(?<!\\)\\(?!\\)/g, "\\\\");
    const importCode = `const ${name} = require("${source}");`;
    const exportCode = `module.exports = { ${name} };`;
    fs.writeFileSync(
      path.resolve(directory, `${path.basename(source)}.js`),
      importCode + "\n" + exportCode
    );
  }
}

module.exports = {
  mode: "production",
  entry: Object.fromEntries(
    fs
      .readdirSync(entriesDir)
      .map((f) => [f.slice(0, -3), path.resolve(entriesDir, f)])
      .filter(([name, _]) => !(name in externals))
  ),
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[contenthash].min.js",
    library: {
      type: "window",
    },
    clean: true,
  },
  externals: externals,
  plugins: [
    new NodePolyfillPlugin(),
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    }),
  ],
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
        terserOptions: {
          output: {
            comments: false,
          },
        },
      }),
    ],
  },
};

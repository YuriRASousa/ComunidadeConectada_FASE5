const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fs = require("fs");
const Fi = require("react-icons/fi");

const ICONS = {
  network: "FiShare2",
  smartphone: "FiSmartphone",
  server: "FiServer",
  lock: "FiLock",
  database: "FiDatabase",
  layout: "FiLayout",
  check: "FiCheckCircle",
  users: "FiUsers",
  message: "FiMessageSquare",
  map: "FiMap",
  code: "FiCode",
  refresh: "FiRefreshCw",
  target: "FiTarget",
  flag: "FiFlag",
  layers: "FiLayers",
  globe: "FiGlobe",
};

async function main() {
  if (!fs.existsSync("pptx_assets")) fs.mkdirSync("pptx_assets");
  for (const [name, comp] of Object.entries(ICONS)) {
    const Comp = Fi[comp];
    const svg = ReactDOMServer.renderToStaticMarkup(
      React.createElement(Comp, { size: 256 })
    );
    const fullSvg = svg.replace(/currentColor/g, "#FFFFFF");
    await sharp(Buffer.from(fullSvg)).png().toFile(`pptx_assets/${name}.png`);
  }
  console.log("icons done");
}

main();

import Color from "color";
import createKDTree from "static-kdtree";

const colorData = require(__dirname + "/../data/colors.json");
const colorTree = createKDTree(colorData.map(([r, g, b]) => [r, g, b]));

export default function (hexColor) {
  const rgbColor = Color(hexColor).rgb().array();
  const nearestIndex = colorTree.nn(rgbColor);
  return colorData[nearestIndex][3];
}

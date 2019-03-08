import { getColorName } from 'fast-color-lookup';
import Color from 'color';

export default function (hexColor)  {
  let rgbColor = Color(hexColor).rgb().array();
  return getColorName(...rgbColor);
};

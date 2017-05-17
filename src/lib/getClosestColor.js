import Color from 'color';
import colorData from './colorData';

export default function (hexColor)  {
  let rgbColor = Color(hexColor).rgb().array();
  let index;
  let dist;

  let length = colorData.length;
  for (var i = 0; i < length; ++i) {
    let color = colorData[i].color;

    let d = Math.sqrt(
      Math.pow(color[0] - rgbColor[0], 2) +
      Math.pow(color[1] - rgbColor[1], 2) +
      Math.pow(color[2] - rgbColor[2], 2)
    );

    if (!dist || d < dist) {
      dist = d;
      index = i;
    }
  }

  return colorData[index].name;
}

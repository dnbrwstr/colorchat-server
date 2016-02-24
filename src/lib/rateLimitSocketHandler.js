const LAST_HOUR_MAX = 1000;
const LAST_MINUTE_MAX = 30;
const LAST_SECOND_MAX = 1;

let rateLimit = function (socket, fn) {
  let lastHour = 0;
  let lastMinute = 0;
  let lastSecond = 0;

  return function (data, cb) {
    ++lastHour;
    ++lastMinute;
    ++lastSecond;

    if (
      lastSecond > LAST_SECOND_MAX ||
      lastMinute > LAST_MINUTE_MAX ||
      lastHour > LAST_HOUR_MAX
    ) {
      // Blackhole for now
    } else {
      fn(data, cb);
    }

    setTimeout(function () {
      --lastSecond;
    }, 1000);

    setTimeout(function () {
      --lastMinute;
    }, 1000 * 60);

    setTimeout(function () {
      --lastHour;
    }, 1000 * 60 * 60);
  }
};

export default rateLimit;

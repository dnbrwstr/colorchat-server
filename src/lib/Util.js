export let getFirstResult = (arr, fn) => {
  for (var i = 0; i < arr.length; ++i) {
    let result = fn(arr[i]);
    if (result) {
      return result;
    }
  }
}

export let mapTimes = (n, fn) => {
  var res = [];
  for (var i = 0; i < n; ++i) {
    res.push(fn(i));
  }
  return res;
}

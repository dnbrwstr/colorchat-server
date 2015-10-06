let wrapAsyncRoute = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(function (err) {
      next(err);
    });
  };
};

export default wrapAsyncRoute;

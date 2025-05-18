require("./helpers/configure");

var sinon = require("sinon"),
  expect = require("chai").expect,
  getClosestColor = require("../src/lib/getClosestColor").default;

describe("getClosestColor", function () {
  it("Gets the closest color", function (done) {
    expect(getClosestColor("#007b76")).to.equal("surfie green");
    done();
  });
});

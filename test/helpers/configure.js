require("dotenv").config({ path: ".env.test" });
require("babel-register");
require("babel-polyfill");
require("../../src/lib/promisify");

require('dotenv').load();
require('babel/register');

var sinon = require('sinon'),
  expect = require('chai').expect;
  PhoneNumberUtils = require('../src/lib/PhoneNumberUtils');

var baseNumber = '+14013911814';

var testNumbers = {
  '411': null,
  '73276': null,
  '3835527': '+14013835527',
  '739-7924': '+14017397924',
  '4014657109': '+14014657109',
  '16664653927': '+16664653927',
  '442079834000': '+442079834000',
  '9512624343904971': null
};

describe('PhoneNumberUtils', function () {
  Object.keys(testNumbers).forEach(function (key) {
    var description = 'Correctly normalizes ' + key + ' to ' + testNumbers[key]
    it(description, function () {
      var result = PhoneNumberUtils.normalize(key, baseNumber);
      expect(result).to.equal(testNumbers[key]);
    });
  });

  it('Accepts an array', function () {
    var inputs = Object.keys(testNumbers)
    var outputs = inputs.map(function (i) { return testNumbers[i]; });

    var result = PhoneNumberUtils.normalize(inputs, baseNumber);
    expect(result).to.deep.equal(outputs);
  });
});

import { PhoneNumberUtil } from 'google-libphonenumber';
import { getFirstResult } from './Util';

let defaultRegion = process.env.DEFAULT_REGION;
let numberUtil = PhoneNumberUtil.getInstance();

export let makeString = n =>
  `+${n.countryCode}${n.destinationCode}${n.baseNumber}`;

// Check if a number is dialable
export let validate = (number, countryCode) => {
  let region = numberUtil.getRegionCodeForCountryCode(countryCode);
  let parsedNumber = getParsedNumber(number, region);
  return parsedNumber && numberUtil.isValidNumber(parsedNumber);
};

// Transform an arbitrary, user-input number into a
// dialable number. Will attempt to copy missing region
// and destination codes from reference number
export let normalize = (numberOrArray, referenceNumber) => {
  return numberOrArray instanceof Array ?
    numberOrArray.map(n => normalize(n, referenceNumber)) :
    normalizeWithPermutations(numberOrArray, referenceNumber);
};

let normalizeWithPermutations = (number, baseNumber) => {
  let permutations = [
    number,
    '+' + number
  ];

  return getFirstResult(permutations, (n) => normalizeSingleNumber(n, baseNumber)) || null;
};

let normalizeSingleNumber = (number, referenceNumber) => {
  let baseNumberData = parse(referenceNumber);
  let baseRegion = baseNumberData ? baseNumberData.region : defaultRegion;
  let parsedNumberData = parse(number, baseRegion);

  return parsedNumberData ?
    makeString(maybeCopyDestinationCode(parsedNumberData, baseNumberData)) : null;
};

let parse = (numberToParse, region=defaultRegion) => {
  let number = getParsedNumber(numberToParse, region);
  if (!number) return number;

  let destinationCodeLength = numberUtil.getLengthOfNationalDestinationCode(number);
  let nationalNumber = number.getNationalNumber().toString();
  let baseNumber = nationalNumber.slice(destinationCodeLength);
  // If there's no area code just get the base number
  let destinationCode = destinationCodeLength ?
    nationalNumber.slice(0, destinationCodeLength) : null;

  return numberUtil.isPossibleNumber(number) && {
    countryCode: number.getCountryCodeOrDefault(),
    region: numberUtil.getRegionCodeForNumber(number),
    destinationCode: destinationCode,
    baseNumber: baseNumber
  };
};

// Wrapping this to simplify use as libphonenumber
// will throw an error when it's unable to parse
let getParsedNumber = (number, region) => {
  try {
    return numberUtil.parse(number, region);
  } catch (e) {
    return false;
  }
};

// Assuming that the number's destination code
// is the same as the base number's if it's
// missing and the regions are consistent
let maybeCopyDestinationCode = (numberData, referenceData) => {
  if (!numberData.destinationCode &&
     (!numberData.region || numberData.region == referenceData.region)) {
    return {
      ...numberData,
      destinationCode: referenceData.destinationCode
    };
  } else {
    return numberData;
  }
};

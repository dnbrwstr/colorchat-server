import { PhoneNumberUtil } from 'google-libphonenumber';
import { getFirstResult } from './Util';

let defaultRegion = process.env.DEFAULT_REGION;
let numberUtil = PhoneNumberUtil.getInstance();

export let makeString = n =>
  `+${n.countryCode}${n.destinationCode}${n.baseNumber}`;

export let validate = (number, countryCode) => {
  let region = numberUtil.getRegionCodeForCountryCode(countryCode);
  let parsedNumber = getParsedNumber(number, region);
  return parsedNumber && numberUtil.isValidNumber(parsedNumber);
};

export let normalize = (numberOrArray, userNumber) => {
  return numberOrArray instanceof Array ?
    numberOrArray.map(n => normalize(n, userNumber)) :
    normalizeWithPermutations(numberOrArray, userNumber);
};

let normalizeWithPermutations = (number, baseNumber) => {
  let permutations = [
    number,
    '+' + number
  ];

  return getFirstResult(permutations, (n) => normalizeSingleNumber(n, baseNumber)) || null;
};

let normalizeSingleNumber = (number, userNumber) => {
  let baseNumberData = parse(userNumber);
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

// Parse wrapped to simplify use as libphonenumber
// throws when it's unable to parse
let getParsedNumber = (number, region) => {
  try {
    return numberUtil.parse(number, region);
  } catch (e) {
    return false;
  }
};

let maybeCopyDestinationCode = (numberData, baseData) => {
  if (!numberData.destinationCode &&
     (!numberData.region || numberData.region == baseData.region)) {
    return {
      ...numberData,
      destinationCode: baseData.destinationCode
    };
  } else {
    return numberData;
  }
};

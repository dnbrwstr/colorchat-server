import { PhoneNumberUtil } from 'google-libphonenumber';
import { getFirstResult } from './Util';

let defaultRegion = process.env.DEFAULT_REGION;
let numberUtil = PhoneNumberUtil.getInstance();

export let normalize = (numberOrArray, userNumber) => {
  return numberOrArray instanceof Array ?
    numberOrArray.map(n => normalize(n, userNumber)) :
    normalizeWithPermutations(numberOrArray, userNumber);
}

let normalizeWithPermutations = (number, baseNumber) => {
  let permutations = [
    number,
    '+' + number
  ];

  return getFirstResult(permutations, (n) => _normalize(n, baseNumber)) || null;
}

let _normalize = (number, userNumber) => {
  let baseNumberData = parse(userNumber);
  let parsedNumberData = parse(number, baseNumberData.region);

  return parsedNumberData ?
    makeString(maybeCopyDestinationCode(parsedNumberData, baseNumberData)) : null;
}

let parse = (numberToParse, region=defaultRegion) => {
  let number = null;

  try {
    number = numberUtil.parse(numberToParse, region);
  } catch (e) {
    return number;
  }

  let destinationCodeLength = numberUtil.getLengthOfNationalDestinationCode(number);
  let nationalNumber = number.getNationalNumber();
  let baseNumber = parseInt(nationalNumber.toString().slice(destinationCodeLength));
  let destinationCode = destinationCodeLength ?
    parseInt(nationalNumber.toString().slice(0, destinationCodeLength)) : null;

  return numberUtil.isPossibleNumber(number) ? {
    countryCode: number.getCountryCodeOrDefault(),
    baseNumber: baseNumber,
    destinationCode: destinationCode,
    region: numberUtil.getRegionCodeForNumber(number)
  } : null;
}

let maybeCopyDestinationCode = (numberData, baseData) => {
  if (!numberData.destinationCode &&
     (!numberData.region || numberData.region == baseData.region)) {
    return {
      ...numberData,
      destinationCode: baseData.destinationCode
    }
  } else {
    return numberData;
  }
};

let makeString = n =>
  `+${n.countryCode}${n.destinationCode}${n.baseNumber}`;

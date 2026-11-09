import crypto from 'crypto';

// A single test login for app store reviewers, who can't receive our SMS codes.
// Set both REVIEW_PHONE_NUMBER (E.164, e.g. +14015550100) and REVIEW_CODE to enable it.
// Use a reserved fictional number (555-0100 to 555-0199) so no real user can collide with it,
// and a long code (10+ digits): /auth/confirm has no attempt limit.

const reviewNumber = () => process.env.REVIEW_PHONE_NUMBER;
const reviewCode = () => process.env.REVIEW_CODE;

export const isReviewNumber = (phoneNumber) =>
  !!reviewNumber() && !!reviewCode() && phoneNumber === reviewNumber();

export const isValidReviewCode = (code) => {
  const expected = Buffer.from(String(reviewCode() || ''));
  const given = Buffer.from(String(code || ''));
  return expected.length > 0 &&
    expected.length === given.length &&
    crypto.timingSafeEqual(expected, given);
};

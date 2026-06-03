import { body } from "express-validator";

export const createCallValidation = [
  body("candidateId")
    .notEmpty()
    .withMessage(
      "Candidate ID is required"
    ),

  body("outcome")
    .notEmpty()
    .withMessage(
      "Outcome is required"
    ),

  body("note")
    .notEmpty()
    .withMessage(
      "Call note is required"
    ),
];
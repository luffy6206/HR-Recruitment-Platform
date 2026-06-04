import { body } from "express-validator";

export const createTaskValidation = [
  body("candidateId")
    .notEmpty(),

  body("title")
    .notEmpty(),
];

export const evaluateTaskValidation = [
  body("outcome")
    .notEmpty()
    .withMessage("Outcome is required")
    .isIn(["SATISFIED", "NEEDS_IMPROVEMENT", "FAILED"])
    .withMessage("Invalid outcome"),

  body("reason")
    .if(body("outcome").equals("FAILED"))
    .notEmpty()
    .withMessage("Reason required when outcome is FAILED"),

  body("newDeadline")
    .if(body("outcome").equals("NEEDS_IMPROVEMENT"))
    .notEmpty()
    .withMessage("newDeadline required when outcome is NEEDS_IMPROVEMENT")
    .isISO8601()
    .toDate()
    .withMessage("newDeadline must be a valid date"),
];
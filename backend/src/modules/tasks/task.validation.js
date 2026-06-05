import { body } from "express-validator";

export const createTaskValidation = [
  body("candidateId")
    .notEmpty()
    .withMessage("Candidate ID is required"),

  body("title")
    .notEmpty()
    .withMessage("Title is required"),

  body("deadline")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("Deadline must be a valid ISO8601 date"),

  body("startDate")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("Start date must be a valid ISO8601 date"),

  body("endDate")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("End date must be a valid ISO8601 date")
    .custom((value, { req }) => {
      if (req.body.startDate && new Date(value) < new Date(req.body.startDate)) {
        throw new Error("End date must be after start date");
      }
      return true;
    }),

  body("projectDemoStatus")
    .optional()
    .isIn(["PENDING", "SCHEDULED", "COMPLETED"])
    .withMessage("Invalid project demo status"),
];

export const submitTaskValidation = [
  body("submissionLink")
    .notEmpty()
    .withMessage("Submission link is required")
    .isURL()
    .withMessage("Submission link must be a valid URL"),
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
import { body } from "express-validator";

export const createInterviewValidation =
  [
    body("candidateId")
      .notEmpty(),

    body("interviewerName")
      .notEmpty(),

    body("interviewType")
      .notEmpty(),

    body("scheduledAt")
      .notEmpty(),
  ];

export const evaluateInterviewValidation = [
  body("decision")
    .notEmpty()
    .withMessage("Decision is required")
    .isIn(["SELECT", "TASK", "DROP"])
    .withMessage("Invalid decision"),
  
  body("reason")
    .if(body("decision").equals("DROP"))
    .notEmpty()
    .withMessage("Reason is required when dropping a candidate"),
];
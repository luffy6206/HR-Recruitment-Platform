import express from "express";

import protect from "../../middleware/auth.middleware.js";

import authorize from "../../middleware/role.middleware.js";

import { ROLES } from "../../constants/roles.js";

import validateRequest from "../../shared/utils/validateRequest.js";

import {
  createUserValidation,
} from "./user.validation.js";

import * as controller from "./user.controller.js";

const router =
  express.Router();

router.post(
  "/",
  protect,
  authorize(
    ROLES.ADMIN
  ),
  createUserValidation,
  validateRequest,
  controller.createUser
);

router.get(
  "/",
  protect,
  authorize(
    ROLES.ADMIN,
    ROLES.HR
  ),
  controller.getUsers
);

router.get(
  "/role/hr",
  protect,
  authorize(
    ROLES.ADMIN,
    ROLES.HR
  ),
  controller.getHRUsers
);

router.get(
  "/:id",
  protect,
  authorize(
    ROLES.ADMIN
  ),
  controller.getUser
);

router.patch(
  "/:id",
  protect,
  authorize(
    ROLES.ADMIN
  ),
  controller.updateUser
);

router.delete(
  "/:id",
  protect,
  authorize(
    ROLES.ADMIN
  ),
  controller.deleteUser
);

export default router;
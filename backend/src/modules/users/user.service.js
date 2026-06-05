import bcrypt from "bcryptjs";

import User from "../auth/auth.model.js";

import AppError from "../../shared/errors/AppError.js";

export const createUser =
  async (payload) => {
    const existingUser =
      await User.findOne({
        email:
          payload.email.toLowerCase(),
      });

    if (existingUser) {
      throw new AppError(
        "User already exists",
        409
      );
    }

    const passwordHash =
      await bcrypt.hash(
        payload.password,
        10
      );

    const user =
      await User.create({
        name: payload.name,

        email:
          payload.email.toLowerCase(),

        passwordHash,

        role: payload.role,
      });

    return user;
  };

export const getUsers =
  async () => {
    return User.find()
      .select("-passwordHash")
      .sort({
        createdAt: -1,
      });
  };

export const getUser =
  async (id) => {
    const user =
      await User.findById(id)
        .select("-passwordHash");

    if (!user) {
      throw new AppError(
        "User not found",
        404
      );
    }

    return user;
  };

export const updateUser =
  async (
    id,
    payload
  ) => {
    const user =
      await User.findById(id);

    if (!user) {
      throw new AppError(
        "User not found",
        404
      );
    }

    if (payload.name)
      user.name =
        payload.name;

    if (payload.role)
      user.role =
        payload.role;

    if (
      payload.isActive !==
      undefined
    ) {
      user.isActive =
        payload.isActive;
    }

    await user.save();

    return user;
  };

export const deleteUser =
  async (id) => {
    const user =
      await User.findById(id);

    if (!user) {
      throw new AppError(
        "User not found",
        404
      );
    }

    user.isActive = false;

    await user.save();

    return user;
  };

export const getHRUsers =
  async () => {
    return User.find({ role: "HR" })
      .select("-passwordHash")
      .sort({
        name: 1,
      });
  };
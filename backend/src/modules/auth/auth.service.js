import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "./auth.model.js";
import AppError from "../../shared/errors/AppError.js";

import {
  generateAccessToken,
} from "../../shared/utils/generateToken.js";

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({
    email: email.toLowerCase(),
  });

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  if (!user.isActive) {
    throw new AppError("Account is inactive", 403);
  }

  const isPasswordValid = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  const accessToken = generateAccessToken({
    id: user._id,
    role: user.role,
  });

  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  user.lastLogin = new Date();

  await user.save();

  return {
    accessToken,
    refreshToken,
    user,
  };
};

export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "30d" }
  );
};

export const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new AppError("Refresh token required", 401);
  }

  const decoded = jwt.verify(
    refreshToken,
    process.env.JWT_REFRESH_SECRET
  );

  const user = await User.findById(decoded.id);

  if (!user || user.refreshToken !== refreshToken) {
    throw new AppError("Invalid refresh token", 401);
  }

  const accessToken = generateAccessToken({
    id: user._id,
    role: user.role,
  });

  return { accessToken };
};

export const logout = async (userId) => {
  const user = await User.findById(userId);

  if (user) {
    user.refreshToken = null;
    await user.save();
  }

  return true;
};
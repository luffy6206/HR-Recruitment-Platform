import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();

import bcrypt from "bcryptjs";

import connectDB from "../config/database.js";
import User from "../modules/auth/auth.model.js";
import { ROLES } from "../constants/roles.js";

export const seedDemoUsers = async () => {
    const demoUsers = [
      {
        name: "System Admin",
        email: "admin@company.com",
        password: "Admin@123",
        role: ROLES.ADMIN,
      },
      {
        name: "HR Manager",
        email: "hr@company.com",
        password: "Hr@123",
        role: ROLES.HR,
      },
    ];

    for (const demoUser of demoUsers) {
      const existingUser = await User.findOne({
        email: demoUser.email,
      });

      if (existingUser) {
        console.log(`${demoUser.email} already exists`);
        continue;
      }

      const passwordHash = await bcrypt.hash(
        demoUser.password,
        10
      );

      await User.create({
        name: demoUser.name,
        email: demoUser.email,
        passwordHash,
        role: demoUser.role,
      });

      console.log(`${demoUser.email} created successfully`);
    }

};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const run = async () => {
    try {
      await connectDB();
      await seedDemoUsers();
      process.exit(0);
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  };

  run();
}
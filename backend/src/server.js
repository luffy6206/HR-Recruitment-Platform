import "dotenv/config";

import app from "./app.js";
import connectDB from "./config/database.js";
import { seedDemoUsers } from "./scripts/createAdmin.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    if (process.env.NODE_ENV !== "production") {
      await seedDemoUsers();
    }

    app.listen(PORT, () => {
      console.log(
        `Server running on port ${PORT}`
      );
    });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

startServer();
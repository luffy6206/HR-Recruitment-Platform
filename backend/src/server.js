import "dotenv/config";
import { createServer } from "http";

import app from "./app.js";
import connectDB from "./config/database.js";
import { seedDemoUsers } from "./scripts/createAdmin.js";
import { socketService } from "./shared/services/socket.service.js";

const PORT = process.env.PORT || 5000;
const httpServer = createServer(app);

const startServer = async () => {
  try {
    await connectDB();

    if (process.env.NODE_ENV !== "production") {
      await seedDemoUsers();
    }

    socketService.init(httpServer);

    httpServer.listen(PORT, () => {
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
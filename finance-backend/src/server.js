import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import budgetRoutes from "./routes/budget.js"; // attention au nom du fichier
import transactionRoutes from "./routes/transaction.js";
import uploadRoutes from "./routes/uploads.js";
import statsRoutes from "./routes/stats.js";
import searchRoutes from "./routes/search.js";
import swaggerRouter from './swagger.js'

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/budgets", budgetRoutes);
app.use("/transaction",transactionRoutes);
app.use("/uploads",uploadRoutes);
app.use("/stats",statsRoutes);
app.use("/search",searchRoutes);
app.use("/docs",swaggerRouter);
// Route test
app.get("/", (req, res) => {
  res.send("API Finance Backend OK");
});

// Lancer le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


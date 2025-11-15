import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import budgetRoutes from "./routes/budget.js"; // attention au nom du fichier
import transactionRoutes from "./routes/transaction.js"

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/budgets", budgetRoutes);
app.use("/transaction",transactionRoutes);
// Route test
app.get("/", (req, res) => {
  res.send("API Finance Backend OK");
});

// Lancer le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

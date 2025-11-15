/**
 * @swagger
 * tags:
 *   name: Stats
 *   description: Statistiques pour le dashboard utilisateur
 */

/**
 * @swagger
 * /stats/budgets:
 *   get:
 *     summary: Statistiques sur les budgets de l'utilisateur
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques des budgets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalAmount:
 *                   type: number
 *                   description: Somme totale de tous les budgets
 *                 count:
 *                   type: integer
 *                   description: Nombre de budgets
 *                 details:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BudgetStats'
 *                 topBudgets:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BudgetStats'
 */

/**
 * @swagger
 * /stats/transactions:
 *   get:
 *     summary: Statistiques sur les transactions de l'utilisateur
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques des transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalAmount:
 *                   type: number
 *                 count:
 *                   type: integer
 *                 byType:
 *                   type: array
 *                   items:
 *                     type: object
 *                 byBudget:
 *                   type: array
 *                   items:
 *                     type: object
 *                 topTransactions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 */

/**
 * @swagger
 * /stats/files:
 *   get:
 *     summary: Statistiques sur les fichiers de transactions
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques des fichiers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                 byTransaction:
 *                   type: array
 *                   items:
 *                     type: object
 */

/**
 * @swagger
 * /stats/temporal:
 *   get:
 *     summary: Statistiques temporelles des transactions
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Transactions regroupées par date
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transactionsByMonth:
 *                   type: array
 *                   items:
 *                     type: object
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     BudgetStats:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         totalTransactions:
 *           type: number
 *         remaining:
 *           type: number
 *         transactionCount:
 *           type: integer
 *
 *     Transaction:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         label:
 *           type: string
 *         type:
 *           type: string
 *         amount:
 *           type: number
 *         budgetId:
 *           type: integer
 *         ownerId:
 *           type: integer
 *         date:
 *           type: string
 *           format: date-time
 */


import express from "express";
import { prisma } from "../libs/prisma.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// ---------------------------
// 1️⃣ Budgets
// ---------------------------
router.get("/budgets", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const budgets = await prisma.budget.findMany({
      where: { ownerId: userId },
      include: { transactions: true }
    });

    const totalAmount = budgets.reduce((sum, b) => sum + b.amount, 0);
    const count = budgets.length;
    const details = budgets.map(b => ({
      id: b.id,
      name: b.name,
      description: b.description,
      totalTransactions: b.transactions.reduce((s, t) => s + t.amount, 0),
      remaining: b.amount,
      transactionCount: b.transactions.length
    }));

    const topBudgets = details.sort((a, b) => b.totalTransactions - a.totalTransactions).slice(0, 5);

    res.json({ totalAmount, count, details, topBudgets });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------
// 2️⃣ Transactions
// ---------------------------
router.get("/transactions", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const transactions = await prisma.transaction.findMany({ where: { ownerId: userId } });

    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const count = transactions.length;

    const byType = await prisma.transaction.groupBy({
      by: ["type"],
      where: { ownerId: userId },
      _sum: { amount: true },
      _count: { id: true }
    });

    const byBudget = await prisma.transaction.groupBy({
      by: ["budgetId"],
      where: { ownerId: userId },
      _sum: { amount: true },
      _count: { id: true }
    });

    const topTransactions = transactions.sort((a, b) => b.amount - a.amount).slice(0, 5);

    res.json({ totalAmount, count, byType, byBudget, topTransactions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------
// 3️⃣ Fichiers
// ---------------------------
router.get("/files", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const files = await prisma.transactionFile.findMany({
      where: { transaction: { ownerId: userId } }
    });

    const count = files.length;

    const byTransaction = await prisma.transactionFile.groupBy({
      by: ["transactionId"],
      _count: { id: true },
      where: { transaction: { ownerId: userId } }
    });

    res.json({ count, byTransaction });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------
// 4️⃣ Temporalité des transactions
// ---------------------------
router.get("/temporal", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Regrouper par mois pour le dashboard
    const transactionsByMonth = await prisma.transaction.groupBy({
      by: ["date"],
      where: { ownerId: userId },
      _sum: { amount: true }
    });

    res.json({ transactionsByMonth });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

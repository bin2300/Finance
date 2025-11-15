/**
 * @swagger
 * tags:
 *   name: Search
 *   description: Recherche dans budgets, transactions et fichiers
 */

/**
 * @swagger
 * /search:
 *   get:
 *     summary: Rechercher par texte ou nombre
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *           enum: [budget, transaction, file]
 *         description: Filtrer par type (optionnel)
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         required: true
 *         description: Texte ou nombre à rechercher
 *     responses:
 *       200:
 *         description: Résultats de la recherche
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 budgets:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Budget'
 *                 transactions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 *                 files:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TransactionFile'
 *       400:
 *         description: Paramètre query manquant
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /search/range:
 *   get:
 *     summary: Rechercher par plage de valeurs (min et/ou max)
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [budget, transaction]
 *         required: true
 *         description: Type de données à filtrer
 *       - in: query
 *         name: min
 *         schema:
 *           type: number
 *         description: Valeur minimale (optionnel)
 *       - in: query
 *         name: max
 *         schema:
 *           type: number
 *         description: Valeur maximale (optionnel)
 *     responses:
 *       200:
 *         description: Résultats filtrés par plage
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 budget:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Budget'
 *                 transaction:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Paramètres manquants ou invalides
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Budget:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         amount:
 *           type: number
 *         type:
 *           type: string
 *         description:
 *           type: string
 *         ownerId:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
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
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     TransactionFile:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         fileName:
 *           type: string
 *         OriginalName:
 *           type: string
 *         transactionId:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 */


import express from "express";
import { prisma } from "../libs/prisma.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * Rechercher dans budgets, transactions et fichiers
 * Frontend envoie :
 *   - filter : "budget" | "transaction" | "file" (optionnel, si vide => tout)
 *   - query : texte ou nombre à chercher
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { filter, query } = req.query;

    if (!query) return res.status(400).json({ error: "La valeur de recherche est requise" });

    const searchResults = {};
    const numericQuery = parseFloat(query); // Si c’est un nombre, on pourra filtrer par montant

    // Recherche Budgets
    if (!filter || filter === "budget") {
      const budgets = await prisma.budget.findMany({
        where: {
          ownerId: req.user.userId,
          OR: [
            { name: { contains: query } },
            { description: { contains: query } },
            ...(isNaN(numericQuery) ? [] : [{ amount: numericQuery }])
          ]
        }
      });
      searchResults.budgets = budgets;
    }

    // Recherche Transactions
    if (!filter || filter === "transaction") {
      const transactions = await prisma.transaction.findMany({
        where: {
          ownerId: req.user.userId,
          OR: [
            { label: { contains: query } },
            { type: { contains: query } },
            ...(isNaN(numericQuery) ? [] : [{ amount: numericQuery }])
          ]
        }
      });
      searchResults.transactions = transactions;
    }

    // Recherche Fichiers
    if (!filter || filter === "file") {
      const files = await prisma.transactionFile.findMany({
        where: {
          transaction: { ownerId: req.user.userId },
          OR: [
            { fileName: { contains: query } },
            { OriginalName: { contains: query } }
          ]
        }
      });
      searchResults.files = files;
    }

    res.json(searchResults);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


router.get("/range", authMiddleware, async (req, res) => {
  try {
    const { type, min, max } = req.query;

    if (!type || !["budget", "transaction"].includes(type)) {
      return res.status(400).json({ error: "Paramètre 'type' invalide ou manquant" });
    }

    if (!min && !max) {
      return res.status(400).json({ error: "Au moins min ou max doit être défini" });
    }

    const minVal = min !== undefined ? parseFloat(min) : undefined;
    const maxVal = max !== undefined ? parseFloat(max) : undefined;

    const whereClause = {
      ownerId: req.user.userId,
      ...(minVal !== undefined ? { amount: { gte: minVal } } : {}),
      ...(maxVal !== undefined ? { amount: { lte: maxVal } } : {}),
    };

    let results = [];

    if (type === "budget") {
      results = await prisma.budget.findMany({ where: whereClause });
    } else if (type === "transaction") {
      results = await prisma.transaction.findMany({ where: whereClause });
    }

    res.json({ [type]: results });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
export default router;

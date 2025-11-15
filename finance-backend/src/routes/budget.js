/**
 * @swagger
 * tags:
 *   name: Budgets
 *   description: Gestion des budgets de l'utilisateur
 */

/**
 * @swagger
 * /budgets:
 *   post:
 *     summary: Créer un nouveau budget
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - amount
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Budget Mensuel"
 *               amount:
 *                 type: number
 *                 example: 1200
 *               type:
 *                 type: string
 *                 example: "personnel"
 *               description:
 *                 type: string
 *                 example: "Budget pour les dépenses personnelles"
 *     responses:
 *       200:
 *         description: Budget créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 budget:
 *                   $ref: '#/components/schemas/Budget'
 *       400:
 *         description: Champs manquants
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /budgets:
 *   get:
 *     summary: Lister tous les budgets de l'utilisateur
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des budgets
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Budget'
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /budgets/{id}:
 *   put:
 *     summary: Modifier un budget existant
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du budget
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               amount:
 *                 type: number
 *               type:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Budget modifié
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 budget:
 *                   $ref: '#/components/schemas/Budget'
 *       404:
 *         description: Budget introuvable
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /budgets/{id}:
 *   delete:
 *     summary: Supprimer un budget
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du budget à supprimer
 *     responses:
 *       200:
 *         description: Budget supprimé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Budget introuvable
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
 */


import express from "express";
import { prisma } from "../libs/prisma.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Créer un budget
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name, amount, type, description } = req.body;

    if (!name || !amount || !type) {
      return res.status(400).json({ error: "Champs manquants" });
    }

    const budget = await prisma.budget.create({
      data: {
        name,
        amount: parseFloat(amount),
        type,
        description: description || null,
        ownerId: req.user.userId, // juste l'id, Prisma gère la relation automatiquement
      },
    });

    res.json({ message: "Budget créé", budget });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Lister tous les budgets de l’utilisateur
router.get("/", authMiddleware, async (req, res) => {
  try {
    const budgets = await prisma.budget.findMany({
      where: { ownerId: req.user.userId },
    });
    res.json(budgets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Modifier un budget
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, amount, type, description } = req.body;

    const budget = await prisma.budget.findFirst({
      where: { id: parseInt(id), ownerId: req.user.userId },
    });

    if (!budget) {
      return res.status(404).json({ error: "Budget introuvable" });
    }

    const updated = await prisma.budget.update({
      where: { id: parseInt(id) },
      data: {
        name: name || budget.name,

        amount: amount !== undefined ? parseFloat(amount) : budget.amount,
        type: type || budget.type,
        description: description ?? budget.description
      },
    });

    res.json({ message: "Budget modifié", budget: updated })
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
})

// Supprimer un budget
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const budget = await prisma.budget.findFirst({
      where: { id: parseInt(id), ownerId: req.user.userId },
    });

    if (!budget) {
      return res.status(404).json({ error: "Budget introuvable" });


    }

    await prisma.budget.delete({
      where: { id: parseInt(id) },
    });
    res.json({ message: "Budget supprimé" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
})
export default router;

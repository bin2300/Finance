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

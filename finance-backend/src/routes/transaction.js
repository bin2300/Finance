import express from "express";
import { prisma } from "../libs/prisma.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Créer une transaction
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { budgetId, amount, label, type } = req.body;

        if (!budgetId || !amount || !label || !type) {
            return res.status(400).json({ error: "Champs manquants" });
        }

        const budget = await prisma.budget.findFirst({
            where: { id: parseInt(budgetId), ownerId: req.user.userId }
        });

        if (!budget) return res.status(404).json({ error: "Budget introuvable" });




        const transaction = await prisma.transaction.create({
            data: {
                budgetId: parseInt(budgetId),
                ownerId: req.user.userId,
                amount: parseFloat(amount), // ici je veux que si le type soit sortie , on soustrait
                label,
                type
            }
        });

        const updatedAmount = type === "sortie"
            ? budget.amount - parseFloat(amount)
            : budget.amount + parseFloat(amount);

        await prisma.budget.update({
            where: { id: parseInt(budgetId) },
            data: { amount: updatedAmount }
        });

        res.json({ message: "Transaction créée", transaction });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
});

// Lister les transactions d'un budget
router.get("/:budgetId", authMiddleware, async (req, res) => {
    try {
        const { budgetId } = req.params;
        const budget = await prisma.budget.findFirst({
            where: { id: parseInt(budgetId), ownerId: req.user.userId }
        });

        if (!budget) return res.status(404).json({ error: "Budget introuvable" });

        const transactions = await prisma.transaction.findMany({
            where: { budgetId: parseInt(budgetId) }
        });

        res.json(transactions);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
});


// Lister toutes les transactions
router.get("/",authMiddleware,async(req,res)=>{
    try{
        const transactions  = await prisma.transaction.findMany({
            where :{ownerId : req.user.userId},
        })
        res.json(transaction);
    }catch(err){
        console.log(err.message);
        res.status(500).json({error : err.message});
    }
}) 


// Modifier une transaction
// Modifier une transaction
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { amount: newAmountRaw, label, type: newType } = req.body;

        const transaction = await prisma.transaction.findFirst({
            where: { id: parseInt(id), ownerId: req.user.userId }
        });

        if (!transaction)
            return res.status(404).json({ error: "Transaction introuvable" });

        const budget = await prisma.budget.findUnique({
            where: { id: transaction.budgetId }
        });

        if (!budget)
            return res.status(404).json({ error: "Budget introuvable" });

        const oldAmount = transaction.amount;
        const oldType = transaction.type;
        const newAmount = newAmountRaw !== undefined ? parseFloat(newAmountRaw) : oldAmount;

        // 1️⃣ Annuler l'effet de l'ancienne transaction
        let budgetAdjustment = 0;
        if (oldType === "entree") {
            budgetAdjustment -= oldAmount;
        } else if (oldType === "sortie") {
            budgetAdjustment += oldAmount;
        }

        // 2️⃣ Appliquer le nouvel effet
        if (newType === "entree") {
            budgetAdjustment += newAmount;
        } else if (newType === "sortie") {
            budgetAdjustment -= newAmount;
        }

        // 3️⃣ Mettre à jour le budget
        const updatedBudget = await prisma.budget.update({
            where: { id: budget.id },
            data: { amount: budget.amount + budgetAdjustment }
        });

        // 4️⃣ Mettre à jour la transaction
        const updatedTransaction = await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
                amount: newAmount,
                label: label || transaction.label,
                type: newType || transaction.type
            }
        });

        res.json({
            message: "Transaction modifiée",
            transaction: updatedTransaction,
            budget: updatedBudget
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Supprimer une transaction
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const transaction = await prisma.transaction.findFirst({
            where: { id: parseInt(id), ownerId: req.user.userId }
        });

        if (!transaction)
            return res.status(404).json({ error: "Transaction introuvable" });

        // Récupérer le budget
        const budget = await prisma.budget.findUnique({
            where: { id: transaction.budgetId }
        });

        if (!budget)
            return res.status(404).json({ error: "Budget introuvable" });

        // Ajuster le montant du budget
        const adjustedAmount = transaction.type === "sortie"
            ? budget.amount + transaction.amount
            : budget.amount - transaction.amount;

        await prisma.budget.update({
            where: { id: budget.id },
            data: { amount: adjustedAmount }
        });

        // Supprimer la transaction
        await prisma.transaction.delete({ where: { id: parseInt(id) } });

        res.json({ message: "Transaction supprimée et budget mis à jour" });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
});


export default router;

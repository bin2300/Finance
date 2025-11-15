/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Gestion des transactions pour l'utilisateur
 */

/**
 * @swagger
 * /transactions:
 *   post:
 *     summary: Créer une nouvelle transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Données de la transaction
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - budgetId
 *               - amount
 *               - label
 *               - type
 *             properties:
 *               budgetId:
 *                 type: integer
 *               amount:
 *                 type: number
 *               label:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [entree, sortie]
 *     responses:
 *       200:
 *         description: Transaction créée et budget mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 transaction:
 *                   $ref: '#/components/schemas/Transaction'
 */

/**
 * @swagger
 * /transactions:
 *   get:
 *     summary: Lister toutes les transactions de l'utilisateur
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Transaction'
 */

/**
 * @swagger
 * /transactions/{budgetId}:
 *   get:
 *     summary: Lister toutes les transactions d'un budget spécifique
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: budgetId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du budget
 *     responses:
 *       200:
 *         description: Liste des transactions pour le budget
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Transaction'
 */

/**
 * @swagger
 * /transactions/{id}:
 *   put:
 *     summary: Modifier une transaction et ajuster le budget
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la transaction
 *     requestBody:
 *       description: Nouvelles valeurs pour la transaction
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               label:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [entree, sortie]
 *     responses:
 *       200:
 *         description: Transaction modifiée et budget ajusté
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 transaction:
 *                   $ref: '#/components/schemas/Transaction'
 *                 budget:
 *                   $ref: '#/components/schemas/Budget'
 */

/**
 * @swagger
 * /transactions/{id}:
 *   delete:
 *     summary: Supprimer une transaction et ajuster le budget
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la transaction
 *     responses:
 *       200:
 *         description: Transaction supprimée et budget mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Transaction:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         budgetId:
 *           type: integer
 *         ownerId:
 *           type: integer
 *         amount:
 *           type: number
 *         label:
 *           type: string
 *         type:
 *           type: string
 *           enum: [entree, sortie]
 *         date:
 *           type: string
 *           format: date-time
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
 */




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

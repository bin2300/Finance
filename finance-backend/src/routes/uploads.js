/**
 * @swagger
 * tags:
 *   name: TransactionFiles
 *   description: Gestion des fichiers liés aux transactions
 */

/**
 * @swagger
 * /files/{transactionId}:
 *   post:
 *     summary: Upload d'un fichier pour une transaction
 *     tags: [TransactionFiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la transaction
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Fichier à uploader (jpeg, jpg, png, webp, pdf)
 *     responses:
 *       200:
 *         description: Fichier uploadé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 file:
 *                   $ref: '#/components/schemas/TransactionFile'
 */

/**
 * @swagger
 * /files/{transactionId}:
 *   get:
 *     summary: Lister tous les fichiers d'une transaction
 *     tags: [TransactionFiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la transaction
 *     responses:
 *       200:
 *         description: Liste des fichiers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TransactionFile'
 */

/**
 * @swagger
 * /files/download/{fileId}:
 *   get:
 *     summary: Télécharger un fichier
 *     tags: [TransactionFiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du fichier
 *     responses:
 *       200:
 *         description: Fichier téléchargé
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       403:
 *         description: Non autorisé ou type de fichier interdit
 *       404:
 *         description: Fichier introuvable
 */

/**
 * @swagger
 * /files/{fileId}:
 *   delete:
 *     summary: Supprimer un fichier et mettre à jour la base de données
 *     tags: [TransactionFiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du fichier à supprimer
 *     responses:
 *       200:
 *         description: Fichier supprimé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       403:
 *         description: Non autorisé
 *       404:
 *         description: Fichier introuvable
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     TransactionFile:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         transactionId:
 *           type: integer
 *         fileName:
 *           type: string
 *         OriginalName:
 *           type: string
 *         mimeType:
 *           type: string
 *         path:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 */



import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { prisma } from "../libs/prisma.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

const UPLOAD_DIR = "uploads/transactions/";

// Extensions autorisées
const allowedExtensions = [".jpeg", ".jpg", ".png", ".webp", ".pdf"];

// ========== MULTER CONFIG ==========
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, unique + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (!allowedExtensions.includes(ext)) {
            return cb(new Error("❌ Type de fichier interdit"));
        }
        cb(null, true);
    }
});

// ===================================================
// 1️⃣ UPLOAD d’un fichier lié à une transaction
// ===================================================
router.post("/:transactionId", authMiddleware, upload.single("file"), async (req, res) => {
    try {
        const { transactionId } = req.params;

        const transaction = await prisma.transaction.findFirst({
            where: { id: parseInt(transactionId), ownerId: req.user.userId }
        });

        if (!transaction) {
            return res.status(404).json({ error: "Transaction introuvable" });
        }

        if (!req.file) {
            return res.status(400).json({ error: "Aucun fichier reçu" });
        }

        const file = await prisma.transactionFile.create({
            data: {
                transactionId: transaction.id,
                fileName: req.file.filename,
                OriginalName: req.file.originalname,
                mimeType: req.file.mimetype,
                path: req.file.filename
            }
        });

        res.json({ message: "Fichier uploadé", file });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ===================================================
// 2️⃣ Lister les fichiers d'une transaction
// ===================================================
router.get("/:transactionId", authMiddleware, async (req, res) => {
    try {
        const { transactionId } = req.params;

        const files = await prisma.transactionFile.findMany({
            where: { transactionId: parseInt(transactionId) }
        });

        res.json(files);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ===================================================
// 3️⃣ Télécharger un fichier
// ===================================================
router.get("/download/:fileId", authMiddleware, async (req, res) => {
    try {
        const { fileId } = req.params;

        const file = await prisma.transactionFile.findUnique({
            where: { id: parseInt(fileId) },
            include: {
                transaction: true
            }
        });

        if (!file) return res.status(404).json({ error: "Fichier introuvable" });

        // Vérification du propriétaire
        if (file.transaction.ownerId !== req.user.userId) {
            return res.status(403).json({ error: "Non autorisé" });
        }

        // Sécurité extension
        const ext = path.extname(file.OriginalName).toLowerCase();
        if (!allowedExtensions.includes(ext)) {
            return res.status(403).json({ error: "Téléchargement interdit" });
        }

        const filePath = path.join(UPLOAD_DIR, file.path);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: "Fichier manquant sur le serveur" });
        }

        // Construction d'un nom propore
        const dowloadName = file.OriginalName.endsWith(ext) ? file.OriginalName : `${file.OriginalName}.${ext}`

        return res.download(filePath, dowloadName);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ===================================================
// 4️ Supprimer un fichier
// ===================================================
router.delete("/:fileId", authMiddleware, async (req, res) => {
    try {
        const { fileId } = req.params;

        const file = await prisma.transactionFile.findUnique({
            where: { id: parseInt(fileId) },
            include: { transaction: true }
        });

        if (!file) return res.status(404).json({ error: "Fichier introuvable" });

        if (file.transaction.ownerId !== req.user.userId) {
            return res.status(403).json({ error: "Non autorisé" });
        }

        // Supprimer fichier du disque
        const filePath = path.join(UPLOAD_DIR, file.path);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Suppr DB
        await prisma.transactionFile.delete({
            where: { id: parseInt(fileId) }
        });

        res.json({ message: "Fichier supprimé" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

export default router;

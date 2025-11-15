import express from "express";
import multer from "multer";
import path from "path";
import { prisma } from "../libs/prisma.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { error } from "console";



const router = express.Router() 

// Confug Multer
const storage = multer.diskStorage({
    destination: (req, file , cb)=>{
        cb(null, "uploads/transactions/");
    },
    filename: (req, file , cb) =>{
        const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9)
        cb(null,uniqueName + path.extname(file.originalname));
    },

});

const upload = multer({storage});


// Upload fichier lié a une transaction 
router.post("/:transactionId",authMiddleware, upload.single("file"),async(req,res)=>{
    try{
        const {transactionId} = req.params;
        const transaction = await prisma.transaction.findFirst({
            where : {id: parseInt(transactionId), ownerId : req.user.userId},
        });

        if(!transaction) {
            return res.status(404).json({error: "Transaction introuvable"});
        }


        const file = await prisma.transactionFile.create({
            data: {
                transactionId : transaction.id , 
                fileName : req.file.filename, 
                OriginalName : req.file.originalname,
                mimeType: req.file.mimetype,
                path: req.file.path,
            }
        });

        res.json({message: "Fichier uploadé",file})
    } catch (err){
        console.error(err);
        res.status(500).json({error : err.message});
    }
});

// Lister les fichier d'une transaction
router.get("/:transactionId",authMiddleware,async (req, res)=>{
    try{
        const {transactionId } = req.params;
        const files = await prisma.transactionFile.findMany({
            where : { transactionId : parseInt(transactionId)}
        });
        res.json(files);
    }catch(err){
        console.error(err);
        res.status(500).json({error : err.message});
    }

})

export default router;
// import express from "express";


// const router = express.Router();


// // Route test /register
// router.post("/register",(req, res)=>{
//     const {email, password} = req.body;
//     console.log("Register :", email, password);
//     res.json({message : "Route resuster Ok"});
// })


// // Route  test /login
// router.post("/login", (req, res) => {
//   const { email, password } = req.body;
//   console.log("Login:", email, password);
//   res.json({ message: "Route login OK" });
// });


// export default router;

import express from "express";
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';
import { prisma } from "../libs/prisma.js"

const router = express.Router();


// REGISTER
router.post("/register", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ error: "Email et mot de passe requis" });

    try {
        // Vérifier si l'utilisateur existe
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) return res.status(400).json({ error: "Email deja utilisé" });

        // Hasher ke mot de passe
        const hashedPassword = await bcrypt.hash(password,10);

        // Creer l'utilisateur
        const user = await prisma.user.create({
            data: {email, password: hashedPassword}
        });
        res.json({
            message : "Utilisateur crée avec succès",
            user : {id: user.id , email : user.email}
        });
    } catch (err){
        res.status(500).json({error : err.message});
    }
});

// LOGIN
// LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "Email et mot de passe requis" });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: "Utilisateur non trouvé" });

    // Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Mot de passe incorrect" });

    const token = jwt.sign(
      { userId: user.id }, // attention à la casse ici
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "1h" }
    );

    res.json({ message: "connecté", token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

import express from "express";
import AuthService from "./auth.service";
import { requireAuth } from "./auth.middleware";
import { UserRepository } from "../../db";


const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    if (!req.body.email || !req.body.password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }
    
    const isEmailInUse = await AuthService.isEmailUsed(req.body.email);

    if (isEmailInUse) {
      res.status(409).json({ error: "Email is already in use" });
      return;
    }

    const user = await AuthService.registerUser(req.body);
    res.status(201).json({ user });
  } catch (error) {
    if (error instanceof Error ) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(400).json({ error: "An error occurred while registering" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { user, token } = await AuthService.loginUser(req.body);
    res.status(200).json({ user, token });
  } catch (error) {
    if (error instanceof Error && error.message) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    res.status(400).json({ error: "An error occurred while logging in" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await UserRepository.findUserById(req.userId!);
  if (!user) return res.status(404).json({ error: "User not found" });

  const securedUser = AuthService.secureUser(user);

  res.status(200).json({ user: securedUser });
});

export default router;
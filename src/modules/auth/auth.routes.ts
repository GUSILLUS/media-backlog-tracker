import express from "express";
import AuthService from "./auth.service";

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { userPayload, password } = req.body;
    const user = await AuthService.registerUser(userPayload, password);
    res.status(201).json({ user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await AuthService.loginUser(email, password);
    res.status(200).json({ user, token });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

export default router;
import express from "express";
import { Login, Signup } from "../contollers/authControllers";


const authRouter = express.Router();

authRouter.post('/signup',Signup);
authRouter.post('/login',Login);

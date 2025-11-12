import { Router } from 'express';
import { getUsers, getUserById } from '../controllers/user.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const userRouter = Router();

userRouter.get('/', asyncHandler(getUsers));
userRouter.get('/:id', asyncHandler(getUserById));

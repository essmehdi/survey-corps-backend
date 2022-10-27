import { User } from "@prisma/client";
import { Request } from "express";

export class RequestWithUser extends Request {
  user: User;
}
import { createTRPCRouter } from "../../trpc";
import { readUser } from "./read";

export const userRouter = createTRPCRouter({
  readUser: readUser,
});

import { createTRPCRouter } from "../../trpc";
import { readUser } from "./read";
import { updateImage, updateUsername } from "./update";

export const userRouter = createTRPCRouter({
  readUser: readUser,
  updateUsername: updateUsername,
  updateImage: updateImage,
});

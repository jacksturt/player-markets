import Capsule, { Environment, CoreCapsule } from "@usecapsule/react-sdk";

export const capsule = new Capsule(
  Environment.BETA, // or Environment.PROD for production
  process.env.NEXT_PUBLIC_CAPSULE_API_KEY
);

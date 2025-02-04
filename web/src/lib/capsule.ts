import Capsule, { Environment, CoreCapsule } from "@usecapsule/react-sdk";

export const capsule = new Capsule(
  Environment.PROD, // or Environment.PROD for production
  process.env.NEXT_PUBLIC_CAPSULE_API_KEY
);

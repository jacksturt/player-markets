import Para, { Environment } from "@getpara/react-sdk";

export const para = new Para(
  Environment.PROD, // or Environment.PROD for production
  process.env.NEXT_PUBLIC_PARA_API_KEY
);

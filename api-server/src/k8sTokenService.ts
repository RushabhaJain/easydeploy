import { GoogleAuth } from "google-auth-library";

export const generateToken = async (
  client_email: string,
  private_key: string
) => {
  const authClient = new GoogleAuth({
    credentials: {
      client_email,
      private_key,
    },
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  return await authClient.getAccessToken();
};

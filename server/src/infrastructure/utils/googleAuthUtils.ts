import { OAuth2Client, TokenPayload } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const verifyGoogleToken = async (
  idToken: string,
): Promise<TokenPayload> => {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new Error('Invalid Google token payload.');
    }

    return payload;
  } catch (error) {
    console.error('Error verifying Google token:', error);
    throw new Error('Google authentication failed.');
  }
};

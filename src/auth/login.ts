import { Config, saveConfig } from "./store.js";
import { graphqlRequest } from "../client.js";

const AUTHENTICATE_MUTATION = `
mutation Authenticate($email: EmailAddress!, $password: Password!, $deviceId: DeviceId, $legacy: Boolean) {
  me {
    authenticateWithPassword(email: $email, password: $password, deviceId: $deviceId, legacy: $legacy) {
      __typename
      ... on AuthenticationFailed { status errorTitle errorDetails }
      ... on AuthenticationSucceeded { status accessToken deviceId }
      ... on AuthenticationChallenged {
        status
        loginId
        deviceId
        expiresAt
        choices { hmac requiresTwoFactor }
      }
    }
  }
}`;

interface AuthFailed {
  __typename: "AuthenticationFailed";
  errorTitle: string;
  errorDetails: string;
}
interface AuthSucceeded {
  __typename: "AuthenticationSucceeded";
  accessToken: string;
  deviceId: string;
}
interface AuthChallenged {
  __typename: "AuthenticationChallenged";
  loginId: string;
  deviceId: string;
}

type AuthResult = AuthFailed | AuthSucceeded | AuthChallenged;

export async function authenticate(
  config: Config,
  email: string,
  password: string,
): Promise<AuthResult> {
  const data = await graphqlRequest<{
    me: { authenticateWithPassword: AuthResult };
  }>(config, "Authenticate", AUTHENTICATE_MUTATION, {
    email,
    password,
    deviceId: config.deviceId,
    legacy: true,
  });
  return data.me.authenticateWithPassword;
}

export async function persistSuccessfulLogin(
  config: Config,
  email: string,
  result: AuthSucceeded,
): Promise<void> {
  config.accessToken = result.accessToken;
  config.deviceId = result.deviceId;
  config.email = email;
  await saveConfig(config);
}

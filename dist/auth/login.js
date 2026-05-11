import { saveConfig } from "./store.js";
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
export async function authenticate(config, email, password) {
    const data = await graphqlRequest(config, "Authenticate", AUTHENTICATE_MUTATION, {
        email,
        password,
        deviceId: config.deviceId,
        legacy: true,
    });
    return data.me.authenticateWithPassword;
}
export async function persistSuccessfulLogin(config, email, result) {
    config.accessToken = result.accessToken;
    config.deviceId = result.deviceId;
    config.email = email;
    await saveConfig(config);
}
//# sourceMappingURL=login.js.map
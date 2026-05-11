import { input, password as passwordPrompt } from "@inquirer/prompts";
import { loadConfig, saveConfig } from "../auth/store.js";
import { authenticate, persistSuccessfulLogin } from "../auth/login.js";
import { isValidTimezone, systemTimezone } from "../format.js";
import { failJson, printJson } from "../util.js";

export async function loginCommand(opts: { email?: string; tz?: string }): Promise<void> {
  const config = await loadConfig();
  const email = opts.email ?? (await input({ message: "Famly email:" }));
  const pw = await passwordPrompt({ message: "Password:", mask: "*" });

  const tz = await resolveTimezone(config.timezone, opts.tz);

  const result = await authenticate(config, email, pw);

  switch (result.__typename) {
    case "AuthenticationSucceeded":
      await persistSuccessfulLogin(config, email, result);
      config.timezone = tz;
      await saveConfig(config);
      printJson({ status: "ok", email, timezone: tz });
      return;
    case "AuthenticationFailed":
      failJson({
        status: "error",
        error: "authentication_failed",
        title: result.errorTitle,
        details: result.errorDetails,
      });
    case "AuthenticationChallenged":
      failJson(
        {
          status: "error",
          error: "two_factor_required",
          hint: "2FA flow is not implemented. Disable 2FA in Famly or wire up the challenge response.",
        },
        2,
      );
  }
}

async function resolveTimezone(
  existing: string | undefined,
  fromFlag: string | undefined,
): Promise<string> {
  if (fromFlag) {
    if (!isValidTimezone(fromFlag)) failJson({ error: "invalid_timezone", value: fromFlag }, 2);
    return fromFlag;
  }
  const fallback = existing ?? systemTimezone();
  const answer = (
    await input({
      message: `Timezone (IANA, e.g. America/Chicago) [${fallback}]:`,
      default: fallback,
    })
  ).trim();
  return isValidTimezone(answer) ? answer : fallback;
}

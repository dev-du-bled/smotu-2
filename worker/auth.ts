import { i18n } from "@better-auth/i18n";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { drizzle } from "drizzle-orm/d1";
import { authSchema } from "./db/auth-schema";

export type Env = {
  ASSETS: Fetcher;
  DB: D1Database;
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  ADMIN_USER_IDS?: string;
  DISCORD_PROMPT_WEBHOOK_URL?: string;
  RECAPTCHA_SECRET_KEY?: string;
  RECAPTCHA_SITE_KEY?: string;
};

const frenchAuthErrors = {
  ACCOUNT_NOT_FOUND: "Compte introuvable.",
  BODY_MUST_BE_AN_OBJECT: "La requête est invalide.",
  CALLBACK_URL_REQUIRED: "L'URL de retour est requise.",
  CHANGE_EMAIL_DISABLED: "Le changement d'email est désactivé.",
  CREDENTIAL_ACCOUNT_NOT_FOUND:
    "Aucun compte avec mot de passe n'est associé à cet utilisateur.",
  CROSS_SITE_NAVIGATION_LOGIN_BLOCKED:
    "Connexion bloquée pour des raisons de sécurité. Réessaie depuis Smotu.",
  EMAIL_ALREADY_VERIFIED: "Cet email est déjà vérifié.",
  EMAIL_CAN_NOT_BE_UPDATED: "L'email ne peut pas être modifié.",
  EMAIL_MISMATCH: "L'email ne correspond pas.",
  EMAIL_NOT_VERIFIED: "Ton email n'est pas vérifié.",
  FAILED_TO_CREATE_SESSION: "Impossible de créer la session.",
  FAILED_TO_CREATE_USER: "Impossible de créer le compte.",
  FAILED_TO_CREATE_VERIFICATION: "Impossible de créer la vérification.",
  FAILED_TO_GET_SESSION: "Impossible de récupérer la session.",
  FAILED_TO_GET_USER_INFO: "Impossible de récupérer les informations du compte.",
  FAILED_TO_UNLINK_LAST_ACCOUNT:
    "Tu ne peux pas retirer le dernier moyen de connexion du compte.",
  FAILED_TO_UPDATE_USER: "Impossible de mettre à jour le compte.",
  FIELD_NOT_ALLOWED: "Ce champ ne peut pas être modifié.",
  ID_TOKEN_NOT_SUPPORTED: "Ce fournisseur ne supporte pas l'id_token.",
  INVALID_CALLBACK_URL: "L'URL de retour est invalide.",
  INVALID_EMAIL: "Email invalide.",
  INVALID_EMAIL_OR_PASSWORD: "Email ou mot de passe invalide.",
  INVALID_ERROR_CALLBACK_URL: "L'URL de retour d'erreur est invalide.",
  INVALID_NEW_USER_CALLBACK_URL:
    "L'URL de retour du nouveau compte est invalide.",
  INVALID_ORIGIN: "Origine invalide.",
  INVALID_PASSWORD: "Mot de passe invalide.",
  INVALID_REDIRECT_URL: "L'URL de redirection est invalide.",
  INVALID_TOKEN: "Jeton invalide.",
  INVALID_USER: "Utilisateur invalide.",
  LINKED_ACCOUNT_ALREADY_EXISTS: "Ce compte est déjà lié.",
  MISSING_FIELD: "Ce champ est requis.",
  MISSING_OR_NULL_ORIGIN: "Origine manquante ou invalide.",
  PASSWORD_ALREADY_SET: "Un mot de passe est déjà défini pour ce compte.",
  PASSWORD_TOO_LONG: "Mot de passe trop long.",
  PASSWORD_TOO_SHORT: "Mot de passe trop court.",
  PROVIDER_NOT_FOUND: "Fournisseur de connexion introuvable.",
  SESSION_EXPIRED: "Session expirée. Reconnecte-toi pour continuer.",
  SESSION_NOT_FRESH: "Session trop ancienne. Reconnecte-toi pour continuer.",
  SOCIAL_ACCOUNT_ALREADY_LINKED: "Ce compte social est déjà lié.",
  TOKEN_EXPIRED: "Jeton expiré.",
  USER_ALREADY_EXISTS: "Ce compte existe déjà.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
    "Ce compte existe déjà. Utilise un autre email.",
  USER_ALREADY_HAS_PASSWORD:
    "Ce compte a déjà un mot de passe. Utilise-le pour supprimer le compte.",
  USER_EMAIL_NOT_FOUND: "Aucun compte n'existe avec cet email.",
  USER_NOT_FOUND: "Utilisateur introuvable.",
  VALIDATION_ERROR: "Données invalides.",
  VERIFICATION_EMAIL_NOT_ENABLED: "La vérification par email n'est pas activée.",
};

function adminUserIds(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export function createAuth(env: Env, request: Request) {
  const origin = env.BETTER_AUTH_URL || new URL(request.url).origin;
  const db = drizzle(env.DB);

  return betterAuth({
    appName: "Smotu",
    basePath: "/api/auth",
    baseURL: origin,
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: authSchema,
      camelCase: true,
      transaction: false,
    }),
    secret: env.BETTER_AUTH_SECRET,
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID || "",
        clientSecret: env.GOOGLE_CLIENT_SECRET || "",
      },
    },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
    },
    plugins: [
      i18n({
        defaultLocale: "fr",
        translations: {
          fr: frenchAuthErrors,
        },
      }),
      admin({
        adminUserIds: adminUserIds(env.ADMIN_USER_IDS),
      }),
    ],
    trustedOrigins: [origin],
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ["google", "email-password"],
      },
    },
    advanced: {
      skipTrailingSlashes: true,
      trustedProxyHeaders: true,
    },
  });
}

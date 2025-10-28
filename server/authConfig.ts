export interface AuthConfig {
  auth: {
    clientId: string;
    authority: string;
    clientSecret: string;
  };
  system: {
    loggerOptions: {
      loggerCallback: (level: any, message: string, containsPii: boolean) => void;
      piiLoggingEnabled: boolean;
      logLevel: number;
    };
  };
}

export const msalConfig: AuthConfig = {
  auth: {
    clientId: process.env.AZURE_CLIENT_ID || "",
    authority: `${process.env.AZURE_CLOUD_INSTANCE || "https://login.microsoftonline.com/"}${process.env.AZURE_TENANT_ID || ""}`,
    clientSecret: process.env.AZURE_CLIENT_SECRET || "",
  },
  system: {
    loggerOptions: {
      loggerCallback(level: any, message: string, containsPii: boolean) {
        if (!containsPii) {
          console.log(`[MSAL] ${message}`);
        }
      },
      piiLoggingEnabled: false,
      logLevel: 3,
    },
  },
};

export const REDIRECT_URI = process.env.AZURE_REDIRECT_URI || "https://ce024f68-a4f6-43ef-bf2b-5a8963f12ae5-00-ptzzz2z0tnld.riker.replit.dev/auth/redirect";
export const POST_LOGOUT_REDIRECT_URI = process.env.AZURE_POST_LOGOUT_REDIRECT_URI || "https://ce024f68-a4f6-43ef-bf2b-5a8963f12ae5-00-ptzzz2z0tnld.riker.replit.dev";
export const GRAPH_ME_ENDPOINT = "https://graph.microsoft.com/v1.0/me";
export const SCOPES = ["user.read"];
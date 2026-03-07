// import "dotenv/config";
import { betterAuth, LogLevel } from "better-auth";
import { magicLink } from "better-auth/plugins";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { resend } from "./resend";
import { sendMagicLinkEmail } from "../../email/magic-link";
import { prisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  logger: {
    log: (
      level: Exclude<LogLevel, "success">,
      message: string,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...args: any[]
    ) => {
      console[level](`[${level}] ${message}`, ...args);
    },
  },
  plugins: [
    magicLink({
      expiresIn: 60 * 60,
      sendMagicLink: async ({ email, token, url }) => {
        const magicLink = `${url}?token=${token}`;
        console.log({
          magicLink,
        });
        await resend.emails.send({
          from: `"Login" <account@designcombo.dev>`,
          to: email,
          subject: "Your login request to Scenify",
          react: sendMagicLinkEmail({ email, magicLink }),
        });
      },
    }),
  ],
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
});

import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // NextAuth v5 requires JWT strategy when the Credentials provider is used —
  // database sessions are not supported with credentials login.
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = credentials?.username as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!username || !password) return null;
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) return null;
        const valid = await compare(password, user.passwordHash);
        if (!valid) return null;
        return { id: user.id, name: user.username, email: user.email ?? null };
      },
    }),
  ],
  pages: { signIn: "/auth/signin" },
  callbacks: {
    jwt({ token, user }) {
      // On initial sign-in, persist the DB user id into the JWT.
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token?.id) session.user.id = token.id as string;
      return session;
    },
  },
});

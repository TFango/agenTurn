import { User } from "@agenturn/db";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

// NextAuth() recibe la config y devuelve 4 herramientas que exportamos:
// - handlers: los endpoints GET/POST que necesita NextAuth en /api/auth
// - auth: función para leer la sesión actual (en server components y middleware)
// - signIn / signOut: funciones para iniciar y cerrar sesión (en client components)
export const { handlers, auth, signIn, signOut } = NextAuth({

  // providers: le decís a NextAuth cómo puede autenticarse un usuario.
  // Podría ser Google, GitHub, etc. Nosotros usamos "Credentials" = email + password.
  providers: [
    Credentials({
      // Le decís a NextAuth qué campos espera el formulario de login
      credentials: { email: {}, password: {} },

      // authorize() es la función que NextAuth ejecuta cuando alguien intenta hacer login.
      // Recibe lo que escribió el usuario en el formulario.
      // Si retornás un objeto → login exitoso
      // Si retornás null o tirás un error → login fallido
      async authorize(credentials) {

        // Buscamos en la DB un usuario con ese email
        const user = await User.findOne({
          where: { email: credentials.email as string }, // "as string" porque NextAuth tipea credentials como unknown
        });

        // Si no existe ningún usuario con ese email, rechazamos
        if (!user) {
          throw new Error("No existe este usuario");
        }

        // bcrypt.compare() verifica si la contraseña que escribió el usuario
        // coincide con el hash guardado en la DB. Retorna true o false.
        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password_hash,
        );

        // Si la contraseña no coincide, rechazamos
        if (!valid) {
          throw new Error("Contraseña incorrecta");
        }

        // Si todo está bien, retornamos los datos del usuario.
        // Estos datos van a viajar dentro del JWT (la cookie cifrada).
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          tenantId: user.tenant_id,       // qué local pertenece este usuario
          role: user.role,                // "admin" o "professional"
          professionalId: user.professional_id, // null si es admin
        };
      },
    }),
  ],

  callbacks: {
    // jwt() se ejecuta cada vez que se crea o refresca el token.
    // "user" solo existe en el primer login — ahí aprovechamos para meter los datos extra.
    // En requests siguientes, "user" es undefined y simplemente devolvemos el token tal cual.
    jwt({ token, user }) {
      if (user) {
        token.tenantId = (user as any).tenantId;
        token.role = (user as any).role;
        token.professionalId = (user as any).professionalId;
      }
      return token; // el token es la cookie cifrada que NextAuth guarda en el browser
    },

    // session() se ejecuta cuando alguien llama a auth() o useSession().
    // Toma los datos del token (cookie) y los expone en el objeto session.
    // Así podés leer session.user.role en cualquier parte de la app.
    session({ session, token }) {
      (session.user as any).tenantId = token.tenantId;
      (session.user as any).role = token.role;
      (session.user as any).professionalId = token.professionalId;
      return session;
    },
  },

  // Le decimos a NextAuth dónde está nuestra página de login custom.
  // Sin esto, redirige a /api/auth/signin que es una página fea por default.
  pages: { signIn: "/login" },

  // Usamos JWT como estrategia de sesión (la sesión vive en la cookie, no en la DB).
  session: { strategy: "jwt" },
});

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// El middleware se ejecuta en cada request antes de que llegue a la página.
// Acá lo "envolvemos" con auth() de NextAuth, que nos da acceso a req.auth
// (los datos de la sesión actual, si existe).
export default auth((req) => {
  // !! convierte el valor a booleano. Si req.auth existe → true, si es null → false.
  const isLoggedIn = !!req.auth;

  // Detectamos si el usuario está intentando entrar a una página de autenticación
  const isAuthPage =
    req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/register");

  // Detectamos si el usuario está intentando entrar al dashboard
  const isDashboard = req.nextUrl.pathname.startsWith("/dashboard");

  // Si quiere entrar al dashboard pero no está logueado → lo mandamos a login
  if (isDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Si ya está logueado pero quiere ir a login o register → lo mandamos al dashboard
  // (no tiene sentido volver a loguearse si ya tenés sesión)
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // En cualquier otro caso, dejamos pasar el request normalmente
  return NextResponse.next();
});

// matcher: le dice a Next.js en qué rutas ejecutar este middleware.
// Sin esto, el middleware correría en TODOS los requests (imágenes, fuentes, etc.) — innecesario.
// /dashboard/:path* significa /dashboard y cualquier subruta (/dashboard/agenda, etc.)
export const config = { matcher: ["/dashboard/:path*", "/login", "/register"] };

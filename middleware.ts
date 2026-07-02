import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isAuthorized(request: NextRequest, user: string, password: string) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Basic ")) return false;

  const encoded = authHeader.slice("Basic ".length);
  try {
    const decoded = atob(encoded);
    const separator = decoded.indexOf(":");
    if (separator === -1) return false;
    const providedUser = decoded.slice(0, separator);
    const providedPassword = decoded.slice(separator + 1);
    return providedUser === user && providedPassword === password;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const user = process.env.BASIC_AUTH_USER;
  const password = process.env.BASIC_AUTH_PASSWORD;

  if (!user || !password) {
    return NextResponse.next();
  }

  if (isAuthorized(request, user, password)) {
    return NextResponse.next();
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="EU CO2 Simulator"',
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth"; // Relative import is safer for now

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(message: string | object, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("UNAUTHORISED");
  }
  return session;
}

export function withErrorHandler(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (req: NextRequest, context: any) => Promise<Response>,
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (req: NextRequest, context: any) => {
    try {
      return await handler(req, context);
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message === "UNAUTHORISED") {
          return errorResponse("Unauthorised", 401);
        }

        // Cleaner way to check for status without using 'any'
        if ("status" in error && (error as { status: number }).status === 404) {
          return errorResponse("Not Found", 404);
        }

        console.error(`[API Error] ${error.message}`);
      }
      return errorResponse("Internal server error", 500);
    }
  };
}

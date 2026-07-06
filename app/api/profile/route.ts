import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

async function getUserFromToken(request: Request) {
  const authHeader = request.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : null;
  if (!token) return { error: "Authentication required.", status: 401 as const };

  const supabaseServer = getSupabaseServer();
  if (!supabaseServer) return { error: "Supabase server configuration not available.", status: 500 as const };

  const { data: userData, error: userError } = await supabaseServer.auth.getUser(token);
  if (userError || !userData.user) return { error: "Invalid user token.", status: 401 as const };

  return { userId: userData.user.id, supabaseServer };
}

export async function GET(request: Request) {
  const result = await getUserFromToken(request);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  const { userId, supabaseServer } = result;

  const { data, error } = await supabaseServer
    .from("profiles")
    .select("id, email, goal, height, weight")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const needsOnboarding = !data?.goal || !data?.height || !data?.weight;

  return NextResponse.json({ profile: data, needsOnboarding });
}

export async function PATCH(request: Request) {
  const result = await getUserFromToken(request);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  const { userId, supabaseServer } = result;

  const body = await request.json();
  const { goal, height, weight } = body;

  const validGoals = ["weight-loss", "muscle-gain", "healthy-eating"];
  if (!validGoals.includes(goal)) {
    return NextResponse.json({ error: "Invalid goal value." }, { status: 400 });
  }
  if (typeof height !== "number" || typeof weight !== "number") {
    return NextResponse.json({ error: "Height and weight must be numbers." }, { status: 400 });
  }

  const { error } = await supabaseServer
    .from("profiles")
    .update({ goal, height, weight })
    .eq("id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

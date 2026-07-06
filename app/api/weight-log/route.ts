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

// GET — fetch last 30 days of weight logs
export async function GET(request: Request) {
  const result = await getUserFromToken(request);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  const { userId, supabaseServer } = result;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const fromDate = thirtyDaysAgo.toISOString().split("T")[0];

  const { data, error } = await supabaseServer
    .from("weight_logs")
    .select("logged_date, weight_kg")
    .eq("user_id", userId)
    .gte("logged_date", fromDate)
    .order("logged_date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ logs: data ?? [] });
}

// POST — log today's weight (upsert: one entry per day)
export async function POST(request: Request) {
  const result = await getUserFromToken(request);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  const { userId, supabaseServer } = result;

  const body = await request.json();
  const weight_kg = Number(body.weight_kg);

  if (!weight_kg || weight_kg <= 0 || weight_kg > 500) {
    return NextResponse.json({ error: "Invalid weight value." }, { status: 400 });
  }

  const today = new Date().toISOString().split("T")[0];

  const { error } = await supabaseServer
    .from("weight_logs")
    .upsert(
      { user_id: userId, logged_date: today, weight_kg },
      { onConflict: "user_id,logged_date" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, logged_date: today, weight_kg });
}
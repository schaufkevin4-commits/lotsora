"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createProdukt } from "@/lib/services/products";

export async function neuesProduktAnlegen() {
  const supabase = await createClient();
  const produkt = await createProdukt(supabase);
  redirect(`/produkte/${produkt.id}`);
}
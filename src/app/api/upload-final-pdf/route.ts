import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const sessionId = formData.get("sessionId") as string;

    if (!file || !sessionId) {
      return NextResponse.json({ error: "Missing file or sessionId" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const filePath = `session-plans/${sessionId}-${Date.now()}.pdf`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const upload = await supabase.storage
      .from("session-plans")
      .upload(filePath, buffer, {
        contentType: "application/pdf",
      });

    if (upload.error) {
      console.error(upload.error);
      return NextResponse.json({ error: upload.error.message }, { status: 500 });
    }

    const { data } = supabase.storage
      .from("session-plans")
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      pdfUrl: data.publicUrl,
    });
  } catch (err: any) {
    console.error("UPLOAD ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
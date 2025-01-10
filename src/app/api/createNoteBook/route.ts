// /api/createNoteBook
import { db } from "@/lib/db";
import { $notes } from "@/lib/db/schema";
import { generateImage, generateImagePrompt } from "@/lib/openai";
import { uploadImageToStorage } from "@/lib/supabase-client";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: Request) {
    const { userId } = await auth();

    if (!userId) {
        return new NextResponse("unauthorised", { status: 401 });
    }
    const body = await req.json();
    const { name } = body;
    const image_description = await generateImagePrompt(name);
    if (!image_description) {
        return new NextResponse("failed to generate image description", {
            status: 500,
        });
    }
    const dalleImageUrl = await generateImage(image_description);
    if (!dalleImageUrl) {
        return new NextResponse("failed to generate image ", {
            status: 500,
        });
    }

    // Upload the DALL-E image to Supabase storage
    const permanentImageUrl = await uploadImageToStorage(dalleImageUrl, userId);
    if (!permanentImageUrl) {
        return new NextResponse("failed to upload image to storage", {
            status: 500,
        });
    }

    const note_ids = await db
        .insert($notes)
        .values({
            name,
            userId,
            imageUrl: permanentImageUrl,
        })
        .returning({
            insertedId: $notes.id,
        });

    if (!note_ids || note_ids.length === 0) {
        return new NextResponse("failed to insert note", {
            status: 500,
        });
    }

    return NextResponse.json({
        note_id: note_ids[0]?.insertedId,
    });
}
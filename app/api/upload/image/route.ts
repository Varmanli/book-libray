import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";

// کانفیگ Cloudinary از env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const data = await req.formData();
    const file = data.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "فایلی ارسال نشده" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const uploadResult: UploadApiResponse = await new Promise(
      (resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "books" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result as UploadApiResponse);
          }
        );
        stream.end(buffer);
      }
    );

    return NextResponse.json({ url: uploadResult.secure_url });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "خطا در آپلود فایل" }, { status: 500 });
  }
}

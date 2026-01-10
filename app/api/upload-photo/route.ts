import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const validTypes = ["image/jpeg", "image/png"]
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: "Only JPG, JPEG, and PNG files are allowed" }, { status: 400 })
    }

    const { cloudinary } = await import("@/lib/cloudinary")

    const filename = `gym-members-${Date.now()}-${file.name}`
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const uploaded = await new Promise<any>((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          folder: "GYM",
          public_id: filename.replace(/\.[^/.]+$/, ""),
          resource_type: "image",
          overwrite: true,
        },
        (error, result) => {
          if (error) return reject(error)
          resolve(result)
        }
      )
      upload.end(buffer)
    })

    return NextResponse.json({
      url: uploaded.secure_url,
      filename: file.name,
      size: file.size,
      publicId: uploaded.public_id,
      width: uploaded.width,
      height: uploaded.height,
      format: uploaded.format,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}

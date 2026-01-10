import { google } from "googleapis"

const clientEmail = process.env.GOOGLE_DRIVE_CLIENT_EMAIL
const privateKeyRaw = process.env.GOOGLE_DRIVE_PRIVATE_KEY

if (!clientEmail) throw new Error("GOOGLE_DRIVE_CLIENT_EMAIL is not set")
if (!privateKeyRaw) throw new Error("GOOGLE_DRIVE_PRIVATE_KEY is not set")

const privateKey = privateKeyRaw.replace(/\\n/g, "\n")

const jwt = new google.auth.JWT({
  email: clientEmail,
  key: privateKey,
  scopes: ["https://www.googleapis.com/auth/drive"],
})

export const drive = google.drive({ version: "v3", auth: jwt })

export async function uploadImageToDrive(params: {
  buffer: Buffer
  mimeType: string
  filename: string
  folderId: string
}) {
  const { buffer, mimeType, filename, folderId } = params

  const fileMetadata = {
    name: filename,
    parents: [folderId],
  }

  const media = {
    mimeType,
    body: BufferToReadable(buffer),
  } as any

  const createRes = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: "id,name,mimeType,size",
  })

  const fileId = createRes.data.id as string

  await drive.permissions.create({
    fileId,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
  })

  const publicUrl = `https://drive.google.com/uc?export=view&id=${fileId}`

  return {
    fileId,
    url: publicUrl,
    name: createRes.data.name,
    mimeType: createRes.data.mimeType,
    size: createRes.data.size,
  }
}

function BufferToReadable(buffer: Buffer) {
  const { Readable } = require("stream") as typeof import("stream")
  const stream = new Readable()
  stream.push(buffer)
  stream.push(null)
  return stream
}

import { v2 as cloudinary } from "cloudinary"

const cloudName = process.env.CLOUDINARY_CLOUD_NAME
const apiKey = process.env.CLOUDINARY_API_KEY
const apiSecret = process.env.CLOUDINARY_API_SECRET
const timeoutMs = Number(process.env.CLOUDINARY_TIMEOUT_MS || 90000)

if (!cloudName) throw new Error("CLOUDINARY_CLOUD_NAME is not set")
if (!apiKey) throw new Error("CLOUDINARY_API_KEY is not set")
if (!apiSecret) throw new Error("CLOUDINARY_API_SECRET is not set")

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
  timeout: timeoutMs,
})

export { cloudinary }

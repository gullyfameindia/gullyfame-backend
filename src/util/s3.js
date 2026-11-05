const { Upload } = require("@aws-sdk/lib-storage");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

require("dotenv").config();

const Bucket = process.env.BUCKET;
const Region = process.env.REGION;
const AccessKey = process.env.ACCESSKEY;
const SecretKey = process.env.SECRETACCESSKEY;

// Bucket layout:
//   media/files/       public  - images, audio, stickers, exports (server uploads)
//   media/reels/       public  - reel videos/thumbnails (presigned client uploads)
//   media/voiceovers/  public  - voice-overs (presigned client uploads)
//   kyc/               PRIVATE - identity documents; only readable via signed links
// The bucket policy makes media/* public. Everything else stays private.
const DEFAULT_FOLDER = "media/files";
const PRIVATE_READ_EXPIRY_SECONDS =
  parseInt(process.env.PRIVATE_READ_EXPIRY_SECONDS) || 600;

const config = {
  region: Region,
  credentials: {
    accessKeyId: AccessKey,
    secretAccessKey: SecretKey,
  },
};

const s3Client = new S3Client(config);

const publicUrl = (key) =>
  `https://${Bucket}.s3.${Region}.amazonaws.com/${key
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;

// Keep keys predictable: no path separators or odd characters from the client.
const safeName = (name) =>
  String(name || "file")
    .replace(/[\\/]/g, "_")
    .replace(/[^A-Za-z0-9._-]/g, "_")
    .slice(-150);

const buildKey = (folder, fileName) =>
  `${folder ? `${folder}/` : ""}${Date.now()}_${safeName(fileName)}`;

/**
 * Upload one file or an array of files through the server.
 *   uploadFileToAws(file)                     -> media/files (public)
 *   uploadFileToAws(file, { folder: "kyc" })  -> kyc (private)
 * Returns { images: [url, ...], keys: [key, ...] } - `images` is always an
 * array of public URLs (same shape as before); use `keys` for private files.
 */
async function uploadFileToAws(file, { folder = DEFAULT_FOLDER } = {}) {
  const files = Array.isArray(file) ? file : [file];
  const images = [];
  const keys = [];

  for (const f of files) {
    const key = await uploadSingleFile(f, folder);
    keys.push(key);
    images.push(publicUrl(key));
  }

  return { images, keys };
}

// Helper function to upload one file; returns its S3 key
async function uploadSingleFile(file, folder) {
  const key = buildKey(folder, file.name);

  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket,
      Key: key,
      Body: file.data,
      ContentType: file.mimetype,
    },
    queueSize: 3,
  });

  await upload.done();
  return key;
}

// Client uploads directly to S3 with this URL (PUT, matching contentType), avoiding a round trip through our server
async function getPresignedUploadUrl({ fileName, contentType, folder }) {
  const key = buildKey(folder, fileName);

  const command = new PutObjectCommand({
    Bucket,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });
  const fileUrl = publicUrl(key);

  return { uploadUrl, fileUrl, key };
}

// Accepts a key ("kyc/123_a.jpg") or a full URL of an object in our bucket
// (older records stored the URL). Returns the key, or null if it isn't ours.
function toKey(keyOrUrl) {
  if (!keyOrUrl || typeof keyOrUrl !== "string") return null;
  if (!/^https?:\/\//i.test(keyOrUrl)) return keyOrUrl.replace(/^\/+/, "");

  try {
    const u = new URL(keyOrUrl);
    const path = decodeURIComponent(u.pathname.replace(/^\/+/, ""));
    // virtual-hosted style: bucket.s3.region.amazonaws.com/key
    if (u.hostname.startsWith(`${Bucket}.s3`)) return path || null;
    // path style: s3.region.amazonaws.com/bucket/key
    if (u.hostname.startsWith("s3") && path.startsWith(`${Bucket}/`)) {
      return path.slice(Bucket.length + 1) || null;
    }
  } catch (_) {}
  return null;
}

/**
 * Short-lived link to read a private object (e.g. a KYC document).
 * Empty input -> "". A URL that isn't in our bucket is returned unchanged.
 */
async function getSignedReadUrl(keyOrUrl, expiresIn = PRIVATE_READ_EXPIRY_SECONDS) {
  if (!keyOrUrl) return "";
  const key = toKey(keyOrUrl);
  if (!key) return keyOrUrl;

  const command = new GetObjectCommand({ Bucket, Key: key });
  return getSignedUrl(s3Client, command, { expiresIn });
}

module.exports = {
  uploadFileToAws,
  getPresignedUploadUrl,
  getSignedReadUrl,
};

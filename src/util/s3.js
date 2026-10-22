const { Upload } = require("@aws-sdk/lib-storage");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

require("dotenv").config();

const Bucket = process.env.BUCKET;
const Region = process.env.REGION;
const AccessKey = process.env.ACCESSKEY;
const SecretKey = process.env.SECRETACCESSKEY;

const config = {
  region: Region,
  credentials: {
    accessKeyId: AccessKey,
    secretAccessKey: SecretKey,
  },
};

const s3Client = new S3Client(config);

// async function uploadFileToAws(file) {
//   const fileName = `${new Date().getTime()}_${file.name}`;
//   const mimetype = file.mimetype;
//   const fileData = file.data;

//   // return { file };
//   const target = {
//     Bucket,
//     Key: fileName,
//     Body: fileData,
//     ContentType: mimetype,
//   };

//   const upload = new Upload({
//     params: target,
//     client: s3Client,
//     queueSize: 3,
//   });

//   upload.on("httpUploadProgress", (progress) => {
//     // console.log(progress);
//   });

//   let data = await upload.done();

//   let qrLocation = data.Location;

//   return { images: qrLocation };
// }

async function uploadFileToAws(file) {
  // If multiple files: file is array
  if (Array.isArray(file)) {
    const urls = [];

    for (const f of file) {
      const url = await uploadSingleFile(f);
      urls.push(url);
    }

    return { images: urls };
  }

  // If single file
  const url = await uploadSingleFile(file);
  return { images: [url] }; // always return array
}

// Helper function to upload one file
async function uploadSingleFile(file) {
  const fileName = `${Date.now()}_${file.name}`;

  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket,
      Key: fileName,
      Body: file.data,
      ContentType: file.mimetype,
    },
    queueSize: 3,
  });

  const data = await upload.done();
  return data.Location;
}

// Client uploads directly to S3 with this URL (PUT, matching contentType), avoiding a round trip through our server
async function getPresignedUploadUrl({ fileName, contentType, folder }) {
  const key = folder
    ? `${folder}/${Date.now()}_${fileName}`
    : `${Date.now()}_${fileName}`;

  const command = new PutObjectCommand({
    Bucket,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });
  const fileUrl = `https://${Bucket}.s3.${Region}.amazonaws.com/${key}`;

  return { uploadUrl, fileUrl, key };
}

module.exports = {
  uploadFileToAws,
  getPresignedUploadUrl,
};

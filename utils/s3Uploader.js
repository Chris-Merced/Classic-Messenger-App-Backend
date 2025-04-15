const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3')
const db = require('../db/queries.js')

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

const deleteFromS3 = async (key) => {
  try {
    const deleteParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      key: key,
    }
    s3.send(new DeleteObjectCommand(deleteParams))
  } catch (err) {
    console.log('There was an error in deleting image from S3 bucket: \n' + err)
    throw new Error('There was an error in deleting image from S3 Bucket')
  }
}

const uploadToS3 = async (buffer, key, contentType) => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }

    await s3.send(new PutObjectCommand(params))

    return `https://${params.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
  } catch (err) {
    console.log(
      'There was an error while uplading image to S3 bucket: \n' + err,
    )
    throw new Error('There was an error while uplading image to S3 bucket')
  }
}

module.exports = { uploadToS3, deleteFromS3 }

const {S3Client, PutObjectCommand} = require('@aws-sdk/client-s3')


const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const uploadToS3 = async (buffer, key, contentType) => {
    const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key, 
        Body: buffer,
        ContentType: contentType,

    };

    await s3.send(new PutObjectCommand(params))

    return `https://${params.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    
}

module.exports = uploadToS3
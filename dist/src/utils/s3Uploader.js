"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToS3 = exports.deleteFromS3 = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
function checkEnv(name) {
    if (!process.env[name]) {
        throw Error("Env Var ${name} is undefined");
    }
    else {
        return process.env[name];
    }
}
const s3 = new client_s3_1.S3Client({
    region: checkEnv("AWS_REGION"),
    credentials: {
        accessKeyId: checkEnv("AWS_ACCESS_KEY_ID"),
        secretAccessKey: checkEnv("AWS_SECRET_ACCESS_KEY"),
    },
});
const deleteFromS3 = async (key) => {
    try {
        const deleteParams = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: key,
        };
        s3.send(new client_s3_1.DeleteObjectCommand(deleteParams));
    }
    catch (err) {
        console.log("There was an error in deleting image from S3 bucket: \n" + err);
        throw new Error("There was an error in deleting image from S3 Bucket");
    }
};
exports.deleteFromS3 = deleteFromS3;
const uploadToS3 = async (buffer, key, contentType) => {
    try {
        const params = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: key,
            Body: buffer,
            ContentType: contentType,
        };
        await s3.send(new client_s3_1.PutObjectCommand(params));
        return `https://${params.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    }
    catch (err) {
        console.log("There was an error while uplading image to S3 bucket: \n" + err);
        throw new Error("There was an error while uplading image to S3 bucket");
    }
};
exports.uploadToS3 = uploadToS3;
exports.default = { uploadToS3: exports.uploadToS3, deleteFromS3: exports.deleteFromS3 };
//# sourceMappingURL=s3Uploader.js.map
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import * as db from "../db/queries";

function checkEnv(name:string){
  if(!process.env[name]){
    throw Error("Env Var ${name} is undefined")
  }else{
    return process.env[name]
  }
}

const s3 = new S3Client({
  region: checkEnv("AWS_REGION"),
  credentials: {
    accessKeyId: checkEnv("AWS_ACCESS_KEY_ID"),
    secretAccessKey: checkEnv("AWS_SECRET_ACCESS_KEY"),
  },
});

export const deleteFromS3 = async (key: string) => {
  try {
    const deleteParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
    };
    s3.send(new DeleteObjectCommand(deleteParams));
  } catch (err) {
    console.log(
      "There was an error in deleting image from S3 bucket: \n" + err
    );
    throw new Error("There was an error in deleting image from S3 Bucket");
  }
};

export const uploadToS3 = async (buffer: Buffer<ArrayBufferLike>, key: string, contentType: string) => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    };

    await s3.send(new PutObjectCommand(params));

    return `https://${params.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  } catch (err) {
    console.log(
      "There was an error while uplading image to S3 bucket: \n" + err
    );
    throw new Error("There was an error while uplading image to S3 bucket");
  }
};

export default { uploadToS3, deleteFromS3 };

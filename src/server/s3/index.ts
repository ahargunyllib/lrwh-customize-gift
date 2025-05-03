import { tryCatch } from "@/shared/lib/try-catch";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "../../env.mjs";

const s3 = new S3Client({
	credentials: {
		accessKeyId: env.AWS_S3_ACCESS_KEY,
		secretAccessKey: env.AWS_S3_SECRET_ACCESS_KEY,
	},
	endpoint: env.AWS_S3_URL,
	region: "ap-southeast-1",
});

export const uploadFileToS3 = async (file: File) => {
	const { data: arrayBuffer, error: bufferError } = await tryCatch(
		file.arrayBuffer(),
	);
	if (bufferError) {
		return {
			success: false,
			error: bufferError.message,
			message: "Failed to convert file to ArrayBuffer",
		};
	}

	const buffer = Buffer.from(arrayBuffer);
	const command = new PutObjectCommand({
		Bucket: env.AWS_S3_BUCKET_NAME,
		Key: file.name,
		Body: buffer,
		ACL: "public-read",
		ContentType: file.type,
	});

	const { error } = await tryCatch(s3.send(command));
	if (error) {
		return {
			success: false,
			error: error.message,
			message: "Failed to upload file",
		};
	}

	return {
		success: true,
		data: {
			fileUrl: `${env.AWS_S3_URL}/${env.AWS_S3_BUCKET_NAME}/${file.name}`,
		},
		message: "File uploaded successfully",
	};
};

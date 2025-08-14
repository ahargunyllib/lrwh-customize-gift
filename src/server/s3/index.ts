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

/**
 * Uploads a file to an S3 bucket.
 *
 * @param {File} file - The file to be uploaded. Must be a valid File object.
 * @returns {Promise<{
 *   success: boolean,
 *   data?: { fileUrl: string },
 *   error?: string,
 *   message: string
 * }>} - A promise resolving to an object indicating the result of the upload.
 *   - On success: { success: true, data: { fileUrl: string }, message: string }
 *   - On failure: { success: false, error: string, message: string }
 * @throws {Error} If an unexpected error occurs during the upload process.
 *
 * Potential error cases:
 * - Failure to convert the file to an ArrayBuffer.
 * - Failure to upload the file to the S3 bucket.
 */
export const uploadFileToS3 = async (
	file: File,
): Promise<{
	success: boolean;
	data?: { fileUrl: string };
	error?: string;
	message: string;
}> => {
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

	const fileUrl = new URL(
		`${env.AWS_S3_BUCKET_NAME}/${file.name}`,
		env.AWS_S3_URL,
	).toString();

	return {
		success: true,
		data: {
			fileUrl,
		},
		message: "File uploaded successfully",
	};
};

/**
 * Uploads a buffer to an S3 bucket.
 *
 * @param {Buffer} buffer - The buffer to be uploaded. Must be a valid Buffer object.
 * @param {string} fileName - The name of the file to be uploaded.
 * @param {string} [contentType="application/octet-stream"] - The content type of the file.
 * @returns {Promise<{
 *   success: boolean,
 *   data?: { fileUrl: string },
 *   error?: string,
 *   message: string
 * }>} - A promise resolving to an object indicating the result of the upload.
 *   - On success: { success: true, data: { fileUrl: string }, message: string }
 *   - On failure: { success: false, error: string, message: string }
 */
export const uploadBufferToS3 = async (
	buffer: Buffer,
	fileName: string,
	contentType = "application/octet-stream",
): Promise<{
	success: boolean;
	data?: { fileUrl: string };
	error?: string;
	message: string;
}> => {
	const command = new PutObjectCommand({
		Bucket: env.AWS_S3_BUCKET_NAME,
		Key: fileName,
		Body: buffer,
		ACL: "public-read",
		ContentType: contentType,
	});

	const { error } = await tryCatch(s3.send(command));
	if (error) {
		return {
			success: false,
			error: error.message,
			message: "Failed to upload buffer",
		};
	}

	const fileUrl = new URL(
		`${env.AWS_S3_BUCKET_NAME}/${fileName}`,
		env.AWS_S3_URL,
	).toString();

	return {
		success: true,
		data: {
			fileUrl,
		},
		message: "Buffer uploaded successfully",
	};
};

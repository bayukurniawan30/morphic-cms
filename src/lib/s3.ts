import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import crypto from 'node:crypto'

function getS3Client() {
  const region = process.env.AWS_REGION
  if (!region) {
    throw new Error('AWS_REGION is not defined in environment variables')
  }
  return new S3Client({ region })
}

export async function uploadBufferToS3(
  buffer: Buffer,
  fileName: string,
  folder?: string,
  mimeType?: string
) {
  const bucketName = process.env.AWS_S3_BUCKET
  if (!bucketName) {
    throw new Error('AWS_S3_BUCKET is not defined in environment variables')
  }

  const s3Client = getS3Client()

  // Generate a unique key
  const timestamp = Date.now()
  const randomString = crypto.randomBytes(4).toString('hex')
  
  // Clean filename
  const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  
  let key = `${timestamp}-${randomString}-${safeFileName}`
  if (folder) {
    // Ensure folder doesn't have leading/trailing slashes for clean keys
    const cleanFolder = folder.replace(/^\/+|\/+$/g, '')
    key = `${cleanFolder}/${key}`
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: mimeType || 'application/octet-stream',
  })

  try {
    await s3Client.send(command)
    
    // Construct the public URL (assuming public-read bucket)
    const region = process.env.AWS_REGION
    const secureUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`

    return {
      secure_url: secureUrl,
      public_id: key, // Use the S3 key as the public_id
      resource_type: mimeType?.startsWith('image/') ? 'image' : 'raw',
      format: fileName.split('.').pop() || '',
      bytes: buffer.byteLength,
    }
  } catch (err: any) {
    console.error('S3 upload failed:', err)
    throw new Error('Failed to upload file to S3')
  }
}

export async function deleteFromS3(publicId: string) {
  const bucketName = process.env.AWS_S3_BUCKET
  if (!bucketName) {
    console.error('AWS_S3_BUCKET missing for deletion')
    return null
  }

  const s3Client = getS3Client()
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: publicId,
  })

  try {
    await s3Client.send(command)
    return { result: 'ok' }
  } catch (err) {
    console.error('S3 delete request failed:', err)
    return null
  }
}

export async function createS3Folder(folderPath: string) {
  // Amazon S3 does not require explicit folder creation. 
  // Folders are created implicitly when an object is uploaded with a specific key prefix.
  // We return a mock success object to satisfy the API signature.
  return { success: true, path: folderPath }
}

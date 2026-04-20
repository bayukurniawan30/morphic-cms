import crypto from 'node:crypto'

export async function uploadBufferToCloudinary(
  buffer: Buffer,
  fileName?: string,
  folder?: string
) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      'CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET is not defined in environment variables'
    )
  }

  const timestamp = Math.round(new Date().getTime() / 1000)
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`

  // 1. Prepare parameters for signature
  // Cloudinary signature requires parameters to be in alphabetical order
  let signatureData = `timestamp=${timestamp}`
  if (folder) {
    signatureData = `folder=${folder}&timestamp=${timestamp}`
  }
  const signature = crypto
    .createHash('sha1')
    .update(signatureData + apiSecret)
    .digest('hex')

  // 2. Prepare FormData
  const blob = new Blob([new Uint8Array(buffer)])
  const formData = new FormData()
  formData.append('file', blob, fileName || 'uploaded_file')
  formData.append('api_key', apiKey)
  formData.append('timestamp', timestamp.toString())
  formData.append('signature', signature)
  if (folder) {
    formData.append('folder', folder)
  }

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    console.error('Cloudinary upload failed:', errorData)
    throw new Error('Failed to upload file to Cloudinary')
  }

  const data = await response.json()
  return data
}

export async function deleteFromCloudinary(
  publicId: string,
  resourceType: string = 'image'
) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || ''
  const apiKey = process.env.CLOUDINARY_API_KEY || ''
  const apiSecret = process.env.CLOUDINARY_API_SECRET || ''

  if (!cloudName || !apiKey || !apiSecret) {
    console.error('Cloudinary credentials missing for deletion')
    return null
  }

  const timestamp = Math.round(new Date().getTime() / 1000)
  const signatureData = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`
  const signature = crypto
    .createHash('sha1')
    .update(signatureData)
    .digest('hex')
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`

  const formData = new FormData()
  formData.append('public_id', publicId)
  formData.append('signature', signature)
  formData.append('api_key', apiKey)
  formData.append('timestamp', timestamp.toString())

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    })
    const result = await response.json()
    return result
  } catch (err) {
    console.error('Cloudinary delete request failed:', err)
    return null
  }
}

export async function createCloudinaryFolder(folderPath: string) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    console.error('Cloudinary credentials missing for folder creation')
    return null
  }

  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/folders/${folderPath}`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
      },
    })
    const result = await response.json()
    return result
  } catch (err) {
    console.error('Cloudinary folder creation failed:', err)
    return null
  }
}

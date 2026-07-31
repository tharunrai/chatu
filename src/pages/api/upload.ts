import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    // Robust base64 image parsing
    const parts = image.split(';base64,');
    if (parts.length !== 2) {
      return res.status(400).json({ error: 'Invalid base64 image format' });
    }

    const mimeMatch = parts[0].match(/data:(image\/[a-zA-Z0-9\+\-\.]+)/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
    let extension = mimeType.split('/')[1] || 'png';
    if (extension === 'jpeg') extension = 'jpg';
    if (extension.includes('+')) extension = extension.split('+')[0];

    const base64Data = parts[1];
    const buffer = Buffer.from(base64Data, 'base64');

    // Create uploads folder inside public if not present
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`;
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${filename}`;
    return res.status(200).json({ success: true, url: publicUrl });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Failed to upload image' });
  }
}

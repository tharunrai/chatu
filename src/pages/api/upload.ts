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

    // Match base64 header
    const matches = image.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
    
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid base64 image data' });
    }

    const extension = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const base64Data = matches[2];
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

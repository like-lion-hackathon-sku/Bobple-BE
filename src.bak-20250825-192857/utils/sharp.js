import sharp from "sharp";

export const compressProfileImage = async (file) => {
  const compressedBuffer = await sharp(file.buffer)
    .resize({ width: 800 })
    .webp({ quality: 80 })
    .toBuffer();
  return {
    ...file,
    buffer: compressedBuffer,
    mimetype: "image/webp",
    size: compressedBuffer.length,
  };
};

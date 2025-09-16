export const imageToDataURL = (file) => {
  const base64Image = file.buffer.toString("base64");
  const dataUrl = `data:image/webp;base64,${base64Image}`;
  return dataUrl;
};

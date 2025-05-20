import { v2 as cloudinary } from "cloudinary";
// Gowtham's........
// cloudinary.config({
//   cloud_name: "dxynxe5up",
//   api_key: "811734615793229",
//   api_secret: "NyUHj9I7Rf0T-zyHiiAmR7njXT8",

cloudinary.config({
  cloud_name: 'dkfpmc3gk',
  api_key: '291255341558451',
  api_secret: 'tGSuurCBAN7UmKL26aRjQqsX1hA'
});

export async function uploadImage(imagePath: string): Promise<string> {
  if (!imagePath || imagePath.trim() === "") {
    return "";
  }
  try {
    const result = await cloudinary.uploader.upload(imagePath);
    return result.secure_url;
  } catch (error:any) {
    console.log("Cloudinary upload error:", error.toString());
    
    return "";  
  }
}

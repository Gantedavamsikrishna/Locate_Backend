import { v2 as cloudinary } from "cloudinary";
cloudinary.config({
  cloud_name: "dxynxe5up",
  api_key: "811734615793229",
  api_secret: "NyUHj9I7Rf0T-zyHiiAmR7njXT8",
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

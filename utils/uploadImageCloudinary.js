import { v2 as cloudinary } from 'cloudinary';


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET_KEY
});

const uploadImageCloudinary = async (image) => {
    try {
        // Get the buffer from the image or convert it if it's an array buffer
        const buffer = image?.buffer || Buffer.from(await image.arrayBuffer());

        // Upload image to Cloudinary
        const uploadImage = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { folder: "health-wellness" }, // Specify folder name in Cloudinary
                (error, uploadResult) => {
                    if (error) {
                        return reject(new Error(`Cloudinary upload failed: ${error.message}`));
                    }
                    resolve(uploadResult);
                }
            );

            // Write buffer to the upload stream
            uploadStream.end(buffer);
        });

        return uploadImage;
    } catch (error) {
        console.error("Error uploading image to Cloudinary:", error.message);
        throw error; // Rethrow the error for the calling function to handle
    }
};

export default uploadImageCloudinary;

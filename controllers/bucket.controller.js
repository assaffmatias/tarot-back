require("dotenv").config();

const CLOUD_NAME=process.env.CLOUD_NAME;
const API_KEY=process.env.API_KEY;
const API_SECRET=process.env.API_SECRET;

const cloudinary = require('cloudinary').v2;
const { v4: uuid } = require('uuid');


// Return "https" URLs by setting secure: true
cloudinary.config({ 
    cloud_name: CLOUD_NAME, 
    api_key: API_KEY, 
    api_secret: API_SECRET
  });

  module.exports = {
    putObject: async (file, fileType = 'audio/mp3') => {
        const filename = `${uuid()}.${fileType.split('/')[1]}`;
        console.log('Filename:', file);
        

        try {
            const uploadResult = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        resource_type: 'auto',
                        folder: 'tarot-audios',
                        public_id: file.name.split('.')[0]
                    },
                    (error, result) => {
                        fs.unlink(file.tempFilePath, (unlinkError) => {
                            if (unlinkError) console.error('Failed to clean up temp file:', unlinkError);
                        });
                        if (error) {
                            return reject(error);
                        }
                        resolve(result);
                    }
                );
                
                // Use the temporary file path
                const fs = require('fs');
                const readStream = fs.createReadStream(file.tempFilePath);
                readStream.pipe(stream);
            });
        
            console.log('Upload result:', uploadResult);
            return {
                success: true,
                url: uploadResult.secure_url,
                public_id: uploadResult.public_id
            };
        
        } catch (error) {
            fs.unlink(file.audio.tempFilePath, (unlinkError) => {
                if (unlinkError) console.error('Failed to clean up temp file:', unlinkError);
            });
            console.error('Upload error:', error);
            throw new Error(`Failed to upload audio: ${error.message}`);
        }
    }
};
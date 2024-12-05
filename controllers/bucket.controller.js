require("dotenv").config();

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_KEY = process.env.AWS_SECRET_KEY;
const AWS_REGION = process.env.AWS_REGION;
const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME;
const AWS_AUDIO_FOLDER = process.env.AWS_AUDIO_FOLDER;

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
    region: AWS_REGION,
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_KEY
    }
});

module.exports = {
    putObject: async (audioBuffer) => {
        const params = {
            Bucket: AWS_BUCKET_NAME,
            Key: `${AWS_AUDIO_FOLDER}/audio.mp3`,
            Body: audioBuffer,
            ContentType: 'audio/mpeg',
        };

        try {
            await s3.send(new PutObjectCommand(params));
            return `https://${AWS_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${AWS_AUDIO_FOLDER}/audio.mp3`;
        } catch(error) {
            throw new Error(`Error al subir el audio a S3: ${error.message}`);
        }
    }
};
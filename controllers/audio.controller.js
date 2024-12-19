const bucket = require('../controllers/bucket.controller');

module.exports = {
    storeAudio: async (req, res) => {
        //parse audio
        try{
            console.log(req.files)
            const result = await bucket.putObject(req.files);
            res.status(200).json({ result });
        }catch(error){
            console.error(error);
            return res.status(500).json({ error: error.message });
        }
    
    }
}
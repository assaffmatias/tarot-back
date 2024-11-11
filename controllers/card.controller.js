const { Card } = require("../models");

module.exports = {
    postCard: async (req, res, next) => {
        console.log(req.body);
        try {
            const filteredData = Object.fromEntries(
                Object.entries(req.body).filter(([_, value]) => value.trim() !== "")
            );

            if (Object.keys(filteredData).length === 0) {
                return res.status(400).json({ message: "No hay datos para guardar" });
            }

            const results = [];
            for (const [month, text] of Object.entries(filteredData)) {
                const updatedCard = await Card.findOneAndUpdate(
                    { id: month },               
                    { text },                    // Actualizar el texto
                    { upsert: true, new: true }  // Crear si no existe, y devolver la nueva carta
                );
                results.push(updatedCard);
            }

            return res.status(200).json({ updatedCards: results });
        } catch (error) {
            console.error("Error al crear o actualizar la carta:", error);
            next(error);
        }
    },

    getAllCards: async (req, res, next) => {
        try {
            const cards = await Card.find();

            return res.status(200).json(cards);
        } catch (error) {
            console.error("Error al obtener las cartas:", error);
            next(error);
        }
    }
};

const {Notification} = require('../models')
module.exports = {
    createForUser: async (user, message) => {
      try {
          const result = await Notification.create({user, message});
          //console.log("guardado en db",user,message,result,result._id);
          return result._id.toString();
      } catch (error) {
        console.error("Error al crear la notificación", error);
        throw error; // Re-throw the error to be handled by the caller
      }
    },
    createPendingMessage: async ({user, sender}) => {
        const type = 1;
        const message = `Notificacion de chat pendiente!`;
        try{
            const result = await Notification.create({user,sender,type, message});
            return result._id.toString();
        }catch (error) {
          console.error("Error al crear la notificación", error);
        throw error; // Re-throw the error to be handled by the caller
        }

        // Implementation for createPendingMessage
    },
    createForAll: async () => {
        // Implementation for createForAll
    },
    changePendingNotification: async (notificationId, value) => {
        try{
            console.log("trying to change "+notificationId, value);
            
           const notification = await Notification.findByIdAndUpdate(notificationId, { pending: value });
           return notification;
        }catch(error){
            console.error("Error al cambiar el estado de la notificación", error);
        }
        console.log("updateado en la base",notification);
    },
    getNotificationsByUser: async (req, res, next) => {
        
        try{
            console.log("getting notifications for user ", req.params.id);
            const userId = req.params.id
            // console.log("trying to get notifications for user ", userId);
            const notifications = await Notification.find({user: userId, pending: true});
            console.log("notifications for user ", userId, notifications);
            return res.send(notifications);
        }catch(error){
            console.error("Error al obtener las notificaciones");
            next(error);
        }
    }
};
const { addKeyword, addAnswer, EVENTS } = require('@bot-whatsapp/bot')
const flowAgente = require('./flowAgente');

 /**
* Declarando flujo principal
*/
const flowDisable = addKeyword(EVENTS.ACTION)
.addAnswer([
   '🏜️ Hola, Bienvenido a *Minimarket Los Medanos* 🌵', 
   '⌛ Nuestra disponibilidad para atenderte esta desde las 09:00 AM hasta las 10:00 PM. ⌛'
])
.addAnswer(
    [
       '*Pero puedes ver nuestras redes sociales y receurda que en el horario habilitado Empieza tu pedido escribiendo la palabra Hola*', 
       '👉 1 Facebook', 
       '👉 2 Instagram', 
       '👉 3 TicTok'
    ],
    { capture: true,  delay: 2000, idle: 960000 },
    async (ctx,{ endFlow, fallBack, provider}) => {
        
        const refProvider = await provider.getInstance();
        await refProvider.sendPresenceUpdate('recording', ctx?.key?.id); 
        // await refProvider.readMessages([ctx?.key]);
        
        if (ctx.body === "1") {
           return await endFlow({
            body: 'En el siguiente Link tendras la opcion de ver Nuestra Pagina de Facebook\n 🔗 https://www.facebook.com/profile.php?id=61550250449208 \n*Gracias*'});
        }
        
        if (ctx.body === "2") {
            return await endFlow({
            body: 'En el siguiente Link tendras la opcion de ver Nuestra Pagina de Instagram\n 🔗 https://instagram.com/minimarketlosmedanos?igshid=YTQwZjQ0NmI0OA== \n*Gracias*'});
        }
        if (ctx.body === "3") {
            return await endFlow({
            body: 'En el siguiente Link tendras la opcion de ver Nuestro TikTok\n 🔗 https://vm.tiktok.com/ZMjkbTYBg/ \n*Gracias*'});
        } 

        if (ctx?.idleFallBack) {
            service.cleanData(ctx);
            return await endFlow({
                body: '❌  *Finalizado por inactividad*\n\n Para iniciar el proceso de compra debe Escribir la palabra: *Hola* \n\n*Gracias por Comunicarte*'});
        }

        if (![1, 2, 3].includes(parseInt(ctx.body.toLowerCase().trim()))) {
            return fallBack({body: "*Opcion no valida*, \nPor favor seleccione una opcion valida."});
        }
    }
);

module.exports = flowDisable
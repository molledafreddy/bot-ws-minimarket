const { addKeyword, addAnswer, EVENTS } = require('@bot-whatsapp/bot')
const flowAgente = require('./flowAgente');
const globalState = require('../../state/globalState');

/**
* Declarando flujo principal
*/
const flowPrincipal = addKeyword(EVENTS.ACTION)
 .addAnswer([
    '🏜️ Hola, Bienvenido a *Minimarket Los Medanos* 🌵', 
    '⌛ Horario disponible desde las 9:00 AM hasta las 10:00 PM. ⌛',
    '📝 a través de este canal te ofrecemos los siguientes servicios de compra:'
])
 .addAnswer(
     [
        '*Indica el Número de la opción que desees:*', 
        '👉 1 Catalogo de Productos', 
        '👉 2 Conversar con un Agente',
    ],
    { capture: true,  idle: 960000 },
    async (ctx,{gotoFlow, flowDynamic, fallBack,endFlow, provider}) => {
        console.log('datos ')
        const refProvider = await provider.getInstance();
        await refProvider.sendPresenceUpdate('recording', ctx?.key?.id); 
        await refProvider.readMessages([ctx?.key]);
        globalState.update(ctx.from, { name: ctx.pushName ?? ctx.from });
        
        if (ctx?.idleFallBack) {
            console.log('ctx?.idleFallBack', ctx?.idleFallBack)
            service.cleanData(ctx);
            return await endFlow({
                body: '❌  *Finalizado por inactividad*\n\n Para iniciar el proceso de compra debe Escribir la palabra: *Hola* \n\n*Gracias por Comunicarte*'});
        }
       
        if (ctx.body === "1") {

            var carrito = {
                text: 'Presioname 👇🏼',
                contextInfo: {
                    externalAdReply: {
                    title: 'Catalogo Minimarket los Medanos',
                    body: 'Minimarket',
                    mediaType: 'NONE', //VIDEO - IMAGE - NONE
                    //showAdAttribution: true, //Mensaje a partir de un anuncio
                    renderLargerThumbnail: true, 
                    mediaUrl: '',
                    thumbnailUrl: 'https://id1.sgp1.digitaloceanspaces.com/img/midtrans1.jpeg', //url imagen
                    sourceUrl: 'https://wa.me/c/56949079809',
                    }
                }
            };
            globalState.update(ctx.from, { activeCatalog: true});
            const abc = await provider.getInstance();
            await abc.sendMessage(`${ ctx?.from}@c.us`, carrito);
            return;
           
        }

        if (ctx.body === "2") {
            // return await gotoFlow(flowAgente);
        }

        if (![1, 2, 3, 4, 5].includes(parseInt(ctx.body.toLowerCase().trim()))) {
            return fallBack({body: "*Opcion no valida*, \nPor favor seleccione una opcion valida."});
        }
     },
 );

module.exports = flowPrincipal
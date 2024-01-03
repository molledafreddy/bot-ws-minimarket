const { createBot, createProvider, createFlow, addKeyword, addChild, EVENTS, addAnswer, addAction } = require('@bot-whatsapp/bot')

const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const MongoAdapter = require('@bot-whatsapp/database/mongo');
const globalState = require('./state/globalState');
const moment = require("moment");

const { flowInactividad, startInactividad, resetInactividad, stopInactividad,
} = require("./src/idleCasero");

var fs = require('fs');
const service = require('./src/services/productService');
require("dotenv").config();
const delay = (ms) => new Promise((res =>  setTimeout(res, ms)))

/**
 * Declaramos las conexiones de Mongo
 */
// const MONGO_DB_URI = process.env.MONGO_DB_URI;
// const MONGO_DB_NAME = process.env.MONGO_DB_NAME;
const MONGO_DB_URI = "mongodb+srv://molledafreddy:freddy2..@cluster0.1e16p.mongodb.net";
const MONGO_DB_NAME = 'db_bot';

 const flowValidVoice = addKeyword(EVENTS.VOICE_NOTE)
 .addAction(async(ctx,{ fallBack}) => {
    try {
        if (ctx.message.hasOwnProperty('imageMessage')) {
            return fallBack({
                body: "❌  *Opcion no Valida*\n\n Por ahora solo es permitido enviar texto."
            });
        }  
    } catch (error) {
        console.log('error MEdia', error)
    }
});

const flowValidMedia = addKeyword(EVENTS.MEDIA)
 .addAction(async(ctx,{ fallBack}) => {
    try {
        
        if (ctx.message.hasOwnProperty('imageMessage')) {
            resetInactividad(ctx, gotoFlow, 10000);
            return fallBack({
                body: "❌  *Opcion no Valida*\n\n Por ahora solo es permitido enviar texto."
            });
        }  
    } catch (error) {
        console.log('error MEdia', error)
    }
});

const flowValidLocation = addKeyword(EVENTS.LOCATION)
 .addAction(async(ctx,{ fallBack}) => {
    try {
        if (ctx.message.hasOwnProperty('locationMessage')) {
            resetInactividad(ctx, gotoFlow, 10000);
            return fallBack({
                body: "❌  *Opcion no Valida*\n\n Por ahora solo es permitido enviar texto."
            });
        }  
    } catch (error) {
        console.log('error MEdia', error)
    }
});

const flowValidDocument = addKeyword(EVENTS.DOCUMENT)
 .addAction(async(ctx,{ fallBack}) => {
    try {
        if (ctx.message.hasOwnProperty('documentMessage')) {
            resetInactividad(ctx, gotoFlow, 10000);
            return fallBack({
                body: "❌  *Opcion no Valida*\n\n Por ahora solo es permitido enviar texto."
            });
        }  
    } catch (error) {
        console.log('error MEdia', error)
    }
});

const flowAgente = addKeyword(EVENTS.ACTION)
.addAnswer(["*Estamos desviando tu conversacion a nuestro Agente*"], null,
   async(ctx, {provider, endFlow}) => {
    const name = ctx?.pushName;
    const numAgente = ctx?.from;
    console.log('ctx?.from', numAgente)
    const message = `El cliente ${name} con el celular ${numAgente} solicita atencion personalizada`;
    const refProvider = await provider.getInstance();
    
    await refProvider.sendPresenceUpdate('recording', ctx?.key?.id); 
    await provider.sendText('56936499908@s.whatsapp.net', message)
    await provider.sendText('56926070900@s.whatsapp.net', message)

    service.cleanData(ctx);
    stopInactividad(ctx);
    return endFlow({body: '*Gracias*'});
   }
);

const flowEndShopingCart = addKeyword(EVENTS.ACTION)
 .addAnswer(
    [
        'Su orden fue procesada:\n\n',
        'Ingrese su direccion con la siguiente estructura:\n',
        '*Nombre Calle Numeracion, Comuna, Dto/Bloque/Lote Referencia*\n',
    ],
    { capture: true,  delay: 3000},
    async(ctx, { flowDynamic, endFlow, provider }) => {
        const refProvider = await provider.getInstance();
        const jid = ctx?.key?.remoteJid
        
        await refProvider.presenceSubscribe(jid)
        await refProvider.sendPresenceUpdate('composing', jid)
        await delay(500)
        await refProvider.sendPresenceUpdate('recording', ctx?.key?.id); 

        console.log('se ejecuto el flujo de flowEndShoppingCart')

        // if (ctx?.idleFallBack) {
        //     service.cleanData(ctx);
        //     return await endFlow({
        //         body: '❌  *Finalizado por inactividad*\n\n Para iniciar el proceso de compra debe Escribir la palabra: *Hola* \n\n*Gracias por Comunicarte*'});
        // }
        if (ctx?.body?.length > 0) {
            await flowDynamic(await service.saveOrder(ctx, provider))
            service.cleanData(ctx);
            stopInactividad(ctx);
            return endFlow({body: 'Gracias por su Compra'})
        }
    }
 );

const flowValidTime = addKeyword(EVENTS.WELCOME)
.addAction(async(ctx,{gotoFlow, provider}) => {
     try {
        const refProvider = await provider.getInstance();
        // await refProvider.sendPresenceUpdate('recording', ctx?.key?.id); 
        startInactividad(ctx, gotoFlow, 96000);

        const jid = ctx?.key?.remoteJid
        await refProvider.presenceSubscribe(jid)
        await refProvider.sendPresenceUpdate('composing', jid)
        await delay(500)
        const horaActual = moment();
        let horario = "09:00-23:00"
        let rangoHorario = horario.split("-");
        let horaInicio = moment(rangoHorario[0], "HH:mm");
        let horaFin = moment(rangoHorario[1], "HH:mm");
        if (horaActual.isBetween(horaInicio, horaFin)) {
            let activeCatalogo = globalState.get(ctx.from)?.activeCatalog;
            const name = ctx?.pushName;
            const numAgente = ctx?.from;
            const message = `El cliente ${name} con el celular ${numAgente} Esta interactuando con el Bot, estar atento a un posible Pedido`;
            const refProvider = await provider.getInstance();
            await refProvider.sendPresenceUpdate('recording', ctx?.key?.id); 
            await provider.sendText('56936499908@s.whatsapp.net', message);
            await provider.sendText('56926070900@s.whatsapp.net', message);
            if (activeCatalogo === undefined || activeCatalogo === null) {
                return await gotoFlow(flowPrincipal); 
            } else {
                return await gotoFlow(flowAlertPrincipal); 
            }
        } else {
            return await gotoFlow(flowDisable);
        }
    } catch (error) {
        console.log('error', error)
    }
});

 /**
* Declarando flujo principal
*/
const flowDisable = addKeyword(EVENTS.ACTION)
.addAnswer([
   '🏜️ Hola, Bienvenido a *Minimarket Los Médanos* 🌵', 
   '⌛ Nuestra disponibilidad para atenderte esta desde las 09:00 AM hasta las 10:00 PM. ⌛'
])
.addAnswer(
    [
       '*Pero puedes ver nuestras redes sociales y receurda que en el horario habilitado Empieza tu pedido escribiendo la palabra Hola*', 
       '👉 1 Facebook', 
       '👉 2 Instagram', 
       '👉 3 TicTok'
    ],
    { capture: true,  delay: 2000 },
    async (ctx,{ endFlow, fallBack, provider}) => {
        // const refProvider = await provider.getInstance();
        // await refProvider.sendPresenceUpdate('recording', ctx?.key?.id); 
        // await refProvider.readMessages([ctx?.key]);
        // resetInactividad(ctx, gotoFlow, 96000);
        const jid = ctx?.key?.remoteJid
        await refProvider.presenceSubscribe(jid)
        await refProvider.sendPresenceUpdate('composing', jid)
        await delay(500)
        if (ctx.body === "1") {
            service.cleanData(ctx);
            stopInactividad(ctx);
           return await endFlow('En el siguiente Link podra Pagina de Facebook\n 🔗 https://www.facebook.com/profile.php?id=61550250449208 \n*Gracias*');
        }
        
        if (ctx.body === "2") {
            service.cleanData(ctx);
            stopInactividad(ctx);
            return await endFlow('En el siguiente Link podra ver Nuestra Pagina de Instagram\n 🔗 https://instagram.com/minimarketlosmedanos?igshid=YTQwZjQ0NmI0OA== \n*Gracias*');
        }
        if (ctx.body === "3") {
            service.cleanData(ctx);
            stopInactividad(ctx);
            return await endFlow('En el siguiente Link podra ver Nuestro TikTok\n 🔗 https://vm.tiktok.com/ZMjkbTYBg/ \n*Gracias*');
        } 

        // if (ctx?.idleFallBack) {
        //     service.cleanData(ctx);
        //     return await endFlow({
        //         body: '❌  *Finalizado por inactividad*\n\n Para iniciar el proceso de compra debe Escribir la palabra: *Hola* \n\n*Gracias por Comunicarte*'});
        // }

        if (![1, 2, 3].includes(parseInt(ctx.body.toLowerCase().trim()))) {
            resetInactividad(ctx, gotoFlow, 96000);
            return fallBack({body: "*Opcion no valida*, \nPor favor seleccione una opcion valida."});
        }
    }
);

 /**
* Declarando flujo principal
*/
const flowSocialNetworks = addKeyword(EVENTS.ACTION)
.addAnswer([
   '🏜️ *Visita Nuestras Redes Sociales*\n', 
   '⌛ Recuerda que estamos disponibles desde: *09:00 AM hasta las 10:00 PM.* ⌛'
])
.addAnswer(
    [
       '👉 1 Facebook', 
       '👉 2 Instagram', 
       '👉 3 TicTok'
    ],
    { capture: true },
    async (ctx,{ endFlow, gotoFlow, fallBack, provider}) => {
        resetInactividad(ctx, gotoFlow, 96000);
        const refProvider = await provider.getInstance();
        const jid = ctx?.key?.remoteJid
        await refProvider.presenceSubscribe(jid)
        await refProvider.sendPresenceUpdate('composing', jid)
        await delay(500)
        try {
            if (ctx.body === "1") {
                service.cleanData(ctx);
                console.log('mostrar datos', ctx)
                stopInactividad(ctx);
                return endFlow('En el siguiente Link podra ver Nuestra Pagina de Facebook\n 🔗 https://www.facebook.com/profile.php?id=61550250449208 \n\n*Gracias*')
            }
            
            if (ctx.body === "2") {
                service.cleanData(ctx);
                stopInactividad(ctx);
                return await endFlow('En el siguiente Link podra ver Nuestra Pagina de Instagram\n 🔗 https://instagram.com/minimarketlosmedanos?igshid=YTQwZjQ0NmI0OA== \n\n*Gracias*');
            }
            if (ctx.body === "3") {
                service.cleanData(ctx);
                stopInactividad(ctx);
                return await endFlow('En el siguiente Link podra ver Nuestro TikTok\n 🔗 https://vm.tiktok.com/ZMjkbTYBg/ \n*Gracias*');
            } 
    
            if (ctx?.idleFallBack) {
                service.cleanData(ctx);
                stopInactividad(ctx);
                return await endFlow({
                    body: '❌  *Finalizado por inactividad*\n\n Para iniciar el proceso de compra debe Escribir la palabra: *Hola* \n\n*Gracias por Comunicarte*'});
            }
    
            if (![1, 2, 3].includes(parseInt(ctx.body.toLowerCase().trim()))) {

                resetInactividad(ctx, gotoFlow, 96000);
                return fallBack({body: "*Opcion no valida*, \nPor favor seleccione una opcion valida."});
            }
        } catch (error) {
            console.log('error', error)
        }
    }
);

const flowTienda = addKeyword(EVENTS.ORDER)
.addAction(async (ctx,{flowDynamic, gotoFlow})=>{
    try {

        resetInactividad(ctx, gotoFlow, 960000);
        if (ctx.message.hasOwnProperty('orderMessage')) {
            await flowDynamic("Procesando su orden...");
            await flowDynamic(await service.addOrderCatalog(ctx));
            return await gotoFlow(flowEndShopingCart);
        }
    } catch (error) {
        console.log('error tienda', error)
    }
});

/**
* Declarando flujo principal
*/
const flowAlertPrincipal = addKeyword('flowAlertPrincipal')
 .addAnswer([ 'Indique si desea que le enviemos nuevamente el catalogo o necesita hablar con un agente'])
 .addAnswer(
     [
        '*Indica el Número de la opción que desees:*', 
        '👉 1 Cátalogo de Productos', 
        '👉 2 Conversar con un Agente',
        '👉 3 Redes Sociales',
    ],
    { capture: true },
    async (ctx,{gotoFlow, flowDynamic, fallBack,endFlow, provider}) => {
        const refProvider = await provider.getInstance();
        // await refProvider.sendPresenceUpdate('recording', ctx?.key?.id); 
        // await refProvider.readMessages([ctx?.key]);
        const jid = ctx?.key?.remoteJid
        await refProvider.presenceSubscribe(jid)
        await refProvider.sendPresenceUpdate('composing', jid)
        await delay(500)
        globalState.update(ctx.from, { name: ctx.pushName ?? ctx.from });
        
        if ([1].includes(parseInt(ctx.body.toLowerCase().trim()))) {
            console.log('getPromotion')
            var carrito = {
                text: 'Presioname',
                contextInfo: {
                    externalAdReply: {
                    title: 'Catálogo Minimarket los Médanos',
                    body: 'Minimarket',
                    // mediaType: 'NONE', //VIDEO - IMAGE - NONE
                    mediaType: 'IMAGE', //VIDEO - IMAGE - NONE
                    // showAdAttribution: true, //Mensaje a partir de un anuncio
                    renderLargerThumbnail: true, 
                    mediaUrl: 'https://i.postimg.cc/651n2hJh/los-medanos-logo-marca-de-agua.png',
                    thumbnailUrl: 'https://i.postimg.cc/651n2hJh/los-medanos-logo-marca-de-agua.png', //url imagen
                    sourceUrl: 'https://wa.me/c/56950681466',
                    // sourceUrl: 'https://wa.me/c/56949079809',
                    }
                }
            };
            
            globalState.update(ctx.from, { activeCatalog: true});
            const abc = await provider.getInstance();
            resetInactividad(ctx, gotoFlow, 960000);
            return await abc.sendMessage(`${ ctx?.from}@c.us`, carrito);
        }

        if ([2].includes(parseInt(ctx.body.toLowerCase().trim()))) {
            return await gotoFlow(flowAgente);
        }

        if ([3].includes(parseInt(ctx.body.toLowerCase().trim()))) {
            return await gotoFlow(flowSocialNetworks);
        }

        if (![1, 2, 3].includes(parseInt(ctx.body.toLowerCase().trim()))) {
            resetInactividad(ctx, gotoFlow, 96000);
            return fallBack({body: "*Opcion no valida*, \nPor favor seleccione una opcion valida."});
        }
     },
 );


/**
* Declarando flujo principal
*/
const flowPrincipal = addKeyword("welcome")
 .addAnswer([
    '🏜️ Hola, Bienvenido a *Minimarket Los Médanos* 🌵', 
    '⌛ Horario disponible desde las 9:00 AM hasta las 10:00 PM. ⌛',
    '📝 a través de este canal te ofrecemos los siguientes servicios de compra:'
    
])
 .addAnswer(
     [
        '*Indica el Número de la opción que desees:*', 
        '👉 1 Catálogo de Productos', 
        '👉 2 Conversar con un Agente',
        '👉 3 Redes Sociales',
    ],
    { capture: true},
    async (ctx,{ gotoFlow, fallBack, provider}) => {
        const refProvider = await provider.getInstance();
        const jid = ctx?.key?.remoteJid
        await refProvider.presenceSubscribe(jid)
        await refProvider.sendPresenceUpdate('composing', jid)
        await delay(500)
        // const refProvider = await provider.getInstance();
        // await refProvider.sendPresenceUpdate('recording', ctx?.key?.id); 
        // await refProvider.readMessages([ctx?.key]);
        globalState.update(ctx.from, { name: ctx.pushName ?? ctx.from });
        
        if (ctx.body === "1") {

            var carrito = {
                text: 'Presioname',
                contextInfo: {
                    externalAdReply: {
                    title: 'Catálogo Minimarket los Médanos',
                    body: 'Minimarket',
                    // mediaType: 'NONE', //VIDEO - IMAGE - NONE
                    mediaType: 'IMAGE', //VIDEO - IMAGE - NONE
                    // showAdAttribution: true, //Mensaje a partir de un anuncio
                    renderLargerThumbnail: true, 
                    mediaUrl: 'https://i.postimg.cc/651n2hJh/los-medanos-logo-marca-de-agua.png',
                    thumbnailUrl: 'https://i.postimg.cc/651n2hJh/los-medanos-logo-marca-de-agua.png', //url imagen
                    sourceUrl: 'https://wa.me/c/56950681466',
                    // sourceUrl: 'https://wa.me/c/56949079809',
                    }
                }
            };
            globalState.update(ctx.from, { activeCatalog: true});
            const abc = await provider.getInstance();
            await abc.sendMessage(`${ ctx?.from}@c.us`, carrito);
            resetInactividad(ctx, gotoFlow, 960000);
            return;
           
        }

        if ([2].includes(parseInt(ctx.body.toLowerCase().trim()))) {
            return await gotoFlow(flowAgente);
        }

        if ([3].includes(parseInt(ctx.body.toLowerCase().trim()))) {
            return await gotoFlow(flowSocialNetworks);
        }

        if (![1, 2, 3].includes(parseInt(ctx.body.toLowerCase().trim()))) {
            resetInactividad(ctx, gotoFlow, 96000);
            return fallBack({body: "*Opcion no valida*, \nPor favor seleccione una opcion valida."});
        }
     },
 );

const main = async () => {
    const adapterDB = new MongoAdapter({
        dbUri: MONGO_DB_URI,
        dbName: MONGO_DB_NAME,
    });

    const adapterFlow = createFlow([
        flowAgente,
        flowValidTime,
        flowPrincipal, 
        flowDisable,
        flowSocialNetworks,
        flowEndShopingCart,
        flowTienda,
        flowValidMedia,
        flowValidDocument,
        flowValidLocation,
        flowValidVoice,
        flowAlertPrincipal,
        flowInactividad
    ])
    
    const adapterProvider = createProvider(BaileysProvider)
    createBot({
        provider: adapterProvider,
        database: adapterDB,
        flow: adapterFlow,
    });

    QRPortalWeb();
}

main()



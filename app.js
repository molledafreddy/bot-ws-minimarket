const { createBot, createProvider, createFlow, addKeyword, addChild, EVENTS, addAnswer, addAction } = require('@bot-whatsapp/bot')

const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const MongoAdapter = require('@bot-whatsapp/database/mongo');
const globalState = require('./state/globalState');
const moment = require("moment");

var fs = require('fs');
const service = require('./src/services/productService');
require("dotenv").config();

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
    const message = `El cliente ${name} con el celular ${numAgente} solicita atencion personalizada`;
    const refProvider = await provider.getInstance();
    await refProvider.sendPresenceUpdate('recording', ctx?.key?.id); 
    // await refProvider.readMessages([ctx?.key]);
    await provider.sendText('56936499908@s.whatsapp.net', message)
    // await provider.sendText('56926070900@s.whatsapp.net', message)
    service.cleanData(ctx);
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
    async(ctx, {flowDynamic, endFlow, provider}) => {
        // delay: 70000
        // , idle: 960000 
        const refProvider = await provider.getInstance();
        await refProvider.sendPresenceUpdate('recording', ctx?.key?.id); 
        console.log('se ejecuto el flujo de flowEndShoppingCart')

        if (ctx?.idleFallBack) {
            service.cleanData(ctx);
            return await endFlow({
                body: '❌  *Finalizado por inactividad*\n\n Para iniciar el proceso de compra debe Escribir la palabra: *Hola* \n\n*Gracias por Comunicarte*'});
        }
        if (ctx?.body?.length > 0) {
            await flowDynamic(await service.saveOrder(ctx, provider))
            service.cleanData(ctx);
            return endFlow({body: 'Gracias por su Compra'})
        }
    }
 );

const flowValidTime = addKeyword(EVENTS.WELCOME)
.addAction(async(ctx,{gotoFlow, provider}) => {
     try {
        const refProvider = await provider.getInstance();
        await refProvider.sendPresenceUpdate('recording', ctx?.key?.id); 
        console.log('flowValidTime paso activeCatalogo')
        const horaActual = moment();
        let horario = "09:00-24:00"
        let rangoHorario = horario.split("-");
        let horaInicio = moment(rangoHorario[0], "HH:mm");
        let horaFin = moment(rangoHorario[1], "HH:mm");
        if (horaActual.isBetween(horaInicio, horaFin)) {
            let activeCatalogo = globalState.get(ctx.from)?.activeCatalog;
            console.log('activeCatalogo', activeCatalogo)
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
        
        // const refProvider = await provider.getInstance();
        // await refProvider.sendPresenceUpdate('recording', ctx?.key?.id); 
        // await refProvider.readMessages([ctx?.key]);
        
        if (ctx.body === "1") {
           return await endFlow('En el siguiente Link podra Pagina de Facebook\n 🔗 https://www.facebook.com/profile.php?id=61550250449208 \n*Gracias*');
        }
        
        if (ctx.body === "2") {
            return await endFlow('En el siguiente Link podra ver Nuestra Pagina de Instagram\n 🔗 https://instagram.com/minimarketlosmedanos?igshid=YTQwZjQ0NmI0OA== \n*Gracias*');
        }
        if (ctx.body === "3") {
            return await endFlow('En el siguiente Link podra ver Nuestro TikTok\n 🔗 https://vm.tiktok.com/ZMjkbTYBg/ \n*Gracias*');
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
    { capture: true , idle: 960000},
    async (ctx,{ endFlow, fallBack, provider}) => {
        try {
            if (ctx.body === "1") {
                console.log('mostrar datos', ctx)
                return endFlow('En el siguiente Link podra ver Nuestra Pagina de Facebook\n 🔗 https://www.facebook.com/profile.php?id=61550250449208 \n\n*Gracias*')
            }
            
            if (ctx.body === "2") {
                return await endFlow('En el siguiente Link podra ver Nuestra Pagina de Instagram\n 🔗 https://instagram.com/minimarketlosmedanos?igshid=YTQwZjQ0NmI0OA== \n\n*Gracias*');
            }
            if (ctx.body === "3") {
                return await endFlow('En el siguiente Link podra ver Nuestro TikTok\n 🔗 https://vm.tiktok.com/ZMjkbTYBg/ \n*Gracias*');
            } 
    
            if (ctx?.idleFallBack) {
                service.cleanData(ctx);
                return await endFlow({
                    body: '❌  *Finalizado por inactividad*\n\n Para iniciar el proceso de compra debe Escribir la palabra: *Hola* \n\n*Gracias por Comunicarte*'});
            }
    
            if (![1, 2, 3].includes(parseInt(ctx.body.toLowerCase().trim()))) {
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
    { capture: true, idle: 960000 },
    async (ctx,{gotoFlow, flowDynamic, fallBack,endFlow, provider}) => {
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
       
        if ([1].includes(parseInt(ctx.body.toLowerCase().trim()))) {
            console.log('getPromotion')
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
            return await abc.sendMessage(`${ ctx?.from}@c.us`, carrito);
        }

        if ([2].includes(parseInt(ctx.body.toLowerCase().trim()))) {
            return await gotoFlow(flowAgente);
        }

        if ([3].includes(parseInt(ctx.body.toLowerCase().trim()))) {
            return await gotoFlow(flowSocialNetworks);
        }

        if (![1, 2, 3].includes(parseInt(ctx.body.toLowerCase().trim()))) {
            return fallBack({body: "*Opcion no valida*, \nPor favor seleccione una opcion valida."});
        }
     },
 );


/**
* Declarando flujo principal
*/
const flowPrincipal = addKeyword("welcome")
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
        '👉 3 Redes Sociales',
    ],
    { capture: true,  idle: 960000 },
    async (ctx,{ gotoFlow, fallBack,endFlow, provider}) => {
        console.log('data', ctx)
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

        if ([2].includes(parseInt(ctx.body.toLowerCase().trim()))) {
            return await gotoFlow(flowAgente);
        }

        if ([3].includes(parseInt(ctx.body.toLowerCase().trim()))) {
            return await gotoFlow(flowSocialNetworks);
        }

        if (![1, 2, 3].includes(parseInt(ctx.body.toLowerCase().trim()))) {
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



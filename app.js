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

const flowEndShoppingCart = addKeyword(EVENTS.LOCATION)
 .addAnswer(
    [
        'Ingrese su direccion con la siguiente estructura:\n',
        '*Nombre Calle Numeracion, Comuna, Dto/Bloque/Lote Referencia*\n',
    ],
    { capture: true},
    async(ctx, {flowDynamic, endFlow, provider}) => {
        if (ctx.body.length > 0) {
            await flowDynamic(await service.saveOrder(ctx, provider))
            service.cleanData(ctx);
            return endFlow({body: 'Gracias por su Compra'})
        }
    }
 );

 
 const flowLisSelectProducts = addKeyword(['Resumen Compras'])
 .addAnswer(
    [
        '*Opciones disponibles para avanzar:*\n',
        '👉 #1  Concretar Compra',
        '👉 #2  Cancelar Compra',
        '👉 #0  Menu principal\n', 
    ],
     { capture: true},
     async(ctx, {flowDynamic, fallBack, endFlow, gotoFlow}) => {
        console.log(' flowLisSelectProducts llego por aca')
        if (ctx.body == 0) {
           return  await gotoFlow(flowPrincipal);
        }
        
        if (ctx.body == 1) { 
            console.log(' Concretar Compra  Concretar Compra')
            return await gotoFlow(flowEndShoppingCart);
        }
        
        if(ctx.body == 2){ 
            service.cleanData(ctx);
            return endFlow({body: '❌ Su solicitud ha sido cancelada, Cuando desee empezar un nuevo proceso de compra ingrese la palabra *Hola*'}) 
        }

        if (![0, 1, 2].includes(parseInt(ctx.body.toLowerCase().trim()))) {
            service.cleanData(ctx);
            return fallBack({body: "*Opcion no valida*, por favor seleccione una opcion valida."});
        }
     },
 );

 
const flowValidSelectPromotion = addKeyword(EVENTS.WELCOME)
 .addAnswer([
    '🏜️ Hola, Bienvenido a *Minimarket Los Medanos* 🌵', 
    '⌛ Horario disponible desde las 8:00 AM hasta las 10:00 PM. ⌛',
    '📝 a través de este canal te ofrecemos los siguientes servicios de compra:'
    
])
 .addAnswer(
    [
        '*Procesamos su seleccion, indique El numero de su siguiente paso:*\n',
        '👉 #1  Resumen y Finalizar Compra', 
        '👉 #2  Cancelar Compra',
        '👉 #3  Eliminar Productos', 
        '👉 #0  Menu principal\n',
    ],
    { capture: true },
     async (ctx,{gotoFlow, flowDynamic, fallBack, endFlow}) => {
            if (ctx.body == 0) { await gotoFlow(flowPrincipal) }

            if (ctx.body == 1) { 
                await flowDynamic(await service.listProductSelected(ctx));
                return await gotoFlow(flowLisSelectProducts);
            }
            
            if(ctx.body == 2){ 
                service.cleanData(ctx);
                return endFlow({body: '❌ Su solicitud ha sido cancelada, Cuando desee empezar un nuevo proceso de compra ingrese la palabra *Hola*'}) 
            }

            if (ctx.body == 3) { 
                await flowDynamic(await service.listProductSelected(ctx));
                return await gotoFlow(flowValidPromotionDelete);
            }

            if (![0, 1, 3].includes(parseInt(ctx.body.toLowerCase().trim()))) {
                return fallBack({body: "*Opcion no valida*, por favor seleccione una opcion valida."});
            }
         
     },
 );

 const flowValidSelectProd = addKeyword('select')
 .addAnswer(
    [
        '*Procesamos su seleccion, indique El numero de su siguiente paso:*\n',
        '👉 #1  Resumen y Finalizar Compra', 
        '👉 #2  Categorias',
        '👉 #3  Eliminar Productos',
        '👉 #4  Cancelar Compra', 
        '👉 #0  Menu principal\n',
    ],
    { capture: true},
    async(ctx, {gotoFlow, flowDynamic, endFlow, fallBack}) => {
        if (ctx.body == 0) {
            return await gotoFlow(flowPrincipal);
        }
        
        if (ctx.body == 1) {
            await flowDynamic(await service.listProductSelected(ctx));
            return await gotoFlow(flowLisSelectProducts);
        }
        
        if (ctx.body == 2) {
            await flowDynamic(await service.category(ctx));
            return await gotoFlow(flowCategory);
        }

        if (ctx.body == 3) { 
            await flowDynamic(await service.listProductSelected(ctx))
            return await gotoFlow(flowValidProductDelete)
        }

        if(ctx.body == 4){
            service.cleanData(ctx);
            return endFlow({body: '❌ Su solicitud ha sido cancelada, Cuando desee empezar un nuevo proceso de compra ingrese la palabra *Hola*'});
        }
        if (![0, 1, 2, 3].includes(parseInt(ctx.body.toLowerCase().trim()))) {
            return fallBack({body: "*Opcion no valida*, por favor ingrese una opcion valida."});
        }
     },
 );

 const flowValidProductDelete = addKeyword('deleteproducts')
 .addAnswer(
    [
        'Indique los Codigos de los *Productos* que desee eliminar, separados por una coma',
        'Ejemplo: 1,3,5',
        'Digite el Numero *0* para ir al menu anterior',
    ],
    { capture: true},
    async(ctx, {gotoFlow, flowDynamic, endFlow, fallBack}) => {
        if ([0].includes(parseInt(ctx.body.toLowerCase().trim()))) {
            return await gotoFlow(flowPrincipal)
        }

        const valid = await service.validSelectProductDelete(ctx);
        if (!valid) {
            await flowDynamic(await service.deleteProducts(ctx, 'products'));
            const resultvalidListP = await service.validListProducts(ctx);
            if (!resultvalidListP) {
                await flowDynamic(await service.category(ctx));
                return await gotoFlow(flowCategory);
            } else {
                return await gotoFlow(flowValidSelectProd)
            }
            
        }
        return fallBack({body: '❌ Debe indicar el codigo del producto que desea eliminar con una estructura valida Ejemplo 1,2,3'});
     },
 );

 const flowValidPromotionDelete = addKeyword('deletepromotion')
 .addAnswer(
    [
        'Indique los Codigos de las *Promociones* que desee eliminar, separados por una coma',
        'Ejemplo: 1,3,5',
        '\nIngrese El Numero *0* para ir al menu anterior',
    ],
    { capture: true},
    async(ctx, {gotoFlow, flowDynamic, endFlow, fallBack}) => {
        if ([0].includes(parseInt(ctx.body.toLowerCase().trim()))) {
            return await gotoFlow(flowPrincipal)
        }

        const valid = await service.validSelectProductDelete(ctx);
        if (!valid) {
            await flowDynamic(await service.deleteProducts(ctx, 'promotion'));
            const resultvalidList = await service.validListProducts(ctx);
            console.log('validacion resultvalidList ', resultvalidList)
            if (resultvalidList) {
                return await gotoFlow(FlowMenuPromocion);
            } else {
                await flowDynamic(await service.getPromotion(ctx));
                return await gotoFlow(flowPromotion);
            }
            
        }

        return fallBack({body: '❌ Debe indicar el codigo del producto que desea eliminar con una estructura valida Ejemplo 1,2,3'});
     },
 );

 
 const flowLisCategoryLacteos = addKeyword('Lacteos')
 .addAnswer(
    [
        'Indique los Numeros de los productos que desee y la cantidad, separados por una coma',
        'Ejemplo: 1:2,2:1,3:4',
        '\nIngrese el Numero *0* para ir a la lista de categorias',
    ],
    { capture: true},
    async(ctx, {gotoFlow, flowDynamic, fallBack}) => {
        
        if ([0].includes(parseInt(ctx.body.toLowerCase().trim()))) {
            await flowDynamic(await service.category(ctx));
            return await gotoFlow(flowCategory);
        }
        
        const valid = await service.validSelectProducts(ctx);
        if (valid) {
            console.log('validacion categorias ', valid)
            return fallBack({body: '❌ Debe indicar el numero de producto y cantidad con una estructura valida Ejemplo 1:3,2:4'});
        }
        if (!valid) {
            await flowDynamic(await service.addproducts(ctx));
            return await gotoFlow(flowValidSelectProd);
        } 
        
     }
    )
 
 
 const flowCategory = addKeyword(['Categoria', 'Categorias', 'categoria', 'CATEGORIA'])
 .addAnswer(
    ['Ingrese la categoria'],
    { capture: true },
    async (ctx,{flowDynamic, gotoFlow, fallBack}) => {
        if (ctx.body == 0) { return await gotoFlow(flowPrincipal) }
        const validCategory = await service.validSelectCategory(ctx);
        if (validCategory) {
            return fallBack({body: "*Opcion no valida*, \nPor favor seleccione una opcion valida."});
        } else {
            await flowDynamic(await service.product(ctx));
            return await gotoFlow(flowLisCategoryLacteos);
        }
    },
);

 const flowPromotion = addKeyword(['1', 'Promociones', 'Promocion', 'promociones', 'promocion'])
 .addAnswer(
    [
        '*Indique el numero de las Promociones que desee y la cantidad separadas por coma Ejemplo: 1:2,3:2*\n', 
        'Indique Numero *0* para ir al menu principal',
    ],
     { capture: true},
     async (ctx, {gotoFlow, flowDynamic, endFlow, fallBack}) => {
        if ([0].includes(parseInt(ctx.body.toLowerCase().trim()))) {
            return await gotoFlow(flowPrincipal)
        }
        
        let valid = await service.validSelectPromotion(ctx);
        if (!valid) {
            await flowDynamic( await service.addPromotions(ctx));
            return await gotoFlow(FlowMenuPromocion)
        }
        if (valid) {
            return fallBack({body: '❌ Debe indicar las promociones y cantidad con una estructura valida.'});
        }
         
     },
 )
 
 
const FlowMenuPromocion = addKeyword(['MenuPromocion'])
 .addAnswer(
    [
        '*Seleccione una opcion para avanzar:*\n',
        '👉 #1  Resumen y Finalizar Compra',
        '👉 #2  Eliminar Productos', 
        '👉 #3  Cancelar Compra',
        '👉 #0  Menu principal\n',  
    ],
    { capture: true },
     async (ctx,{gotoFlow, flowDynamic, fallBack, endFlow}) => {
        console.log('llego por aca flowValidSelectPromotion')
            if (ctx.body == 0) { return await gotoFlow(flowPrincipal) }

            if (ctx.body == 1) { 
                await flowDynamic(await service.listProductSelected(ctx));
                return await gotoFlow(flowLisSelectProducts);
            }

            if (ctx.body == 2) { 
                await flowDynamic(await service.listProductSelected(ctx))
                return await gotoFlow(flowValidPromotionDelete)
            }
            
            if(ctx.body == 3){ 
                service.cleanData(ctx);
                return endFlow({body: '❌ Su solicitud ha sido cancelada, Cuando desee empezar un nuevo proceso de compra ingrese la palabra *Hola*'}) 
            }
            if (![0, 1, 2].includes(parseInt(ctx.body.toLowerCase().trim()))) {
                return fallBack({body: "*Opcion no valida*, por favor seleccione una opcion valida."});
            }
         
     },
 );

 const FlowAgente = addKeyword(['4', 'Agente', 'AGENTE'])
 .addAnswer(["*Estamos desviando tu conversacion a nuestro Agente*"], null,
    async(ctx, {provider, endFlow}) => {
        const nanoid = await required('nanoid')
        const ID_GROUP = nanoid.nanoid(5)
        const refProvider = await provider.getInstance()
        await refProvider.groupCreate(`Los Medanos Atencion (${ID_GROUP})`, [
            `${ctx.from}@s.whatsapp.net`
        ])
        service.cleanData(ctx);
        return endFlow({body: '*Gracias*'});
    }
);

const FlowAgente2 = addKeyword(['4', 'Agente', 'AGENTE'])
.addAnswer(["*Estamos desviando tu conversacion a nuestro Agente*"], null,
   async(ctx, {provider, endFlow}) => {
    STATUS = false;
    const name = ctx.pushName;
    const numAgente = ctx.key?.remoteJid;
    const message = `El cliente ${name} con el celular ${numAgente} solicita atencion mas personalizada`;
    const refProvider = await provider.getInstance();
    await provider.sendText('56936499908@s.whatsapp.net', message)
    // await provider.sendText('56926070900@s.whatsapp.net', message)
    service.cleanData(ctx);
       return endFlow({body: '*Gracias*'});
   }
);

 const flowLink = addKeyword(['2', 'Link', 'link'])
 .addAnswer(
    [
        'En el siguiente Link tendras la opcion de realizar El pedido de los productos que desees:',
        'Si tienes dudas con el flujo de compra comunicate con un Agente para recibir intrucciones', 
        'Para comunicarte con un Agente escribe la palabra *Hola* Luego en numero #*4* Opciones que permitira que un agente se comunique a tu numero.', 
        '🔗 *https://www.almacenesdigitales.cl/Ecommerce.xhtml?almacen=4361*', 
    ],
    null,
     (ctx,{ endFlow }) => {  return endFlow({body: 'Gracias'}); }
 )

 const flowValidTime = addKeyword( EVENTS.WELCOME)
 .addAction(async(ctx,{gotoFlow}) => {
    const horaActual = moment();
    let horario = "09:00-24:00"
    let rangoHorario = horario.split("-");
    let horaInicio = moment(rangoHorario[0], "HH:mm");
    let horaFin = moment(rangoHorario[1], "HH:mm");
    if (horaActual.isBetween(horaInicio, horaFin)) {
        return await gotoFlow(flowPrincipal); 
    } else {
        return await gotoFlow(flowDisable);
    }
});




 /**
* Declarando flujo principal
*/
const flowDisable = addKeyword("disable")
.addAnswer([
   '🏜️ Hola, Bienvenido a *Minimarket Los Medanos* 🌵', 
   '⌛ Nuestra disponibilidad para atenderte esta desde las 12:00 PM hasta las 10:00 PM. ⌛',
   
])
.addAnswer(
    [
       '*Pero puedes ver nuestras redes sociales y receurda que en el horario habilitado Empieza tu pedido escribiendo la palabra Hola*', 
       '👉 #1 Facebook', 
       '👉 #2 Instagram', 
       '👉 #3 TicTok'
   ],
   { capture: true },
    async (ctx,{ endFlow, fallBack}) => {
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

        if (![1, 2, 3].includes(parseInt(ctx.body.toLowerCase().trim()))) {
            return fallBack({body: "*Opcion no valida*, \nPor favor seleccione una opcion valida."});
        }
    }
)


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
        '👉 #1 Promociones', 
        '👉 #2 Link Carrito de compra Web', 
        '👉 #3 Carrito de compra whatsApp',
        '👉 #4 Conversar con un Agente'
    ],
    { capture: true },
     async (ctx,{gotoFlow, flowDynamic, fallBack, provider}) => {
         globalState.update(ctx.from, { name: ctx.pushName ?? ctx.from });
        //  console.log('provider read', ctx.message)
        //  await service.messageRead(ctx, provider)
       
        if (ctx.body === "1") {
            // await flowDynamic([
            //     {
            //         body: '\n' +
            //           ' 👉# 1: *Promoción Fiesta* Papas fritas corte americano 230 gr, Pepsi 2L, Doritos 200gr. Precio:6.000\n' +
            //           ',\n' +
            //           ' 👉# 2: *Promoción Desayuno* Pan blanco de molde 750gr, Riquesa (cheddar fundido),  Fiambre Sandwich 250gr Precio:8.000\n' +
            //           ',\n' +
            //           ' 👉# 3: *Promoción Hamburguesas* Pan 8un, mayonesa 186 gr, ketchups 397 gr, moztaza 100gr, Carne 8un Precio:8.500\n' +
            //           ',\n' +
            //           ' 👉# 4: *Promocion Arepas* Harina Pan 1k, Queso llanero 250 gr, Mantequilla deline 500 gr, Jamon Fiambre 250 gr Precio:7.500\n' +
            //           ',\n' +
            //           ' 👉# 5: *Promocion Combo Perros Calientes* Mayonesa 100 gr, Kétchup 100 gr, moztaza 100 gr, Papas Hilo, Pan Perro 10 Un, Paquete vianesas 20 Un Precio:10.000\n' +
            //           ',\n' +
            //           ' 👉# 6: *Promocion Completos* Pan 10 un, Mayo 100 gr, moztaza 100gr, Palta 300 gr Precio:5.500\n'
            //       }
            // ])
            const data = await service.getPromotion(ctx)
            console.log('getPromotion', data)
            await flowDynamic([data]);
            console.log('paso el flowDynamy')
            return await gotoFlow(flowPromotion); 
        }
        
        if (ctx.body === "3") {
            await flowDynamic(await service.category(ctx));
            return await gotoFlow(flowCategory);
        }
        
        if (![1, 2, 3, 4].includes(parseInt(ctx.body.toLowerCase().trim()))) {
            return fallBack({body: "*Opcion no valida*, \nPor favor seleccione una opcion valida."});
        }
     },
    [flowLink, FlowAgente2]
 );

const main = async () => {
    const adapterDB = new MongoAdapter({
        dbUri: MONGO_DB_URI,
        dbName: MONGO_DB_NAME,
    });

    const adapterFlow = createFlow([
        flowValidTime,
        flowPrincipal, 
        flowDisable,
        flowLisCategoryLacteos, 
        flowLisSelectProducts,
        flowValidSelectProd,
        flowEndShoppingCart,
        flowCategory,
        flowValidSelectProd,
        FlowMenuPromocion,
        flowValidPromotionDelete,
        flowValidProductDelete,
        flowPromotion,
    ]);
    
    const adapterProvider = createProvider(BaileysProvider)
    createBot({
        provider: adapterProvider,
        database: adapterDB,
        flow: adapterFlow,
    });
    QRPortalWeb();
}

main()



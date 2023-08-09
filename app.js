const { createBot, createProvider, createFlow, addKeyword, addChild, EVENTS, addAnswer, addAction } = require('@bot-whatsapp/bot')

const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const MongoAdapter = require('@bot-whatsapp/database/mongo')

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
            service.cleanData();
            return endFlow({body: 'Gracias por su Compra'})
        }
    }
 );

 
 const flowLisSelectProducts = addKeyword(['Resumen Compras'])
 .addAnswer(
    [
        'Opciones disponibles para avanzar:\n',
        '👉 #1  Concretar Compra',
        '👉 #2  Cancelar Compra',
        '👉 #0  Menu principal\n', 
    ],
     { capture: true},
     async(ctx, {flowDynamic, fallBack, endFlow, gotoFlow}) => {
        console.log(' flowLisSelectProducts llego por aca')
        if (ctx.body == 0) {
           return  await gotoFlow(flowPrincipal)
        }
        
        if (ctx.body == 1) { 
            console.log(' Concretar Compra  Concretar Compra')
            return await gotoFlow(flowEndShoppingCart)
        }
        
        if(ctx.body == 2){ return endFlow({body: '❌ Su solicitud ha sido cancelada, Cuando desee empezar un nuevo proceso de compra ingrese la palabra *Hola*'}) }

        if (![0, 1, 2].includes(parseInt(ctx.body.toLowerCase().trim()))) {
            service.cleanData();
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
        'Procesamos su seleccion, indique El numero de su siguiente paso:.\n',
        '👉 #1  Resumen compras', 
        '👉 #2  Cancelar Compra',
        '👉 #3  Eliminar Productos', 
        '👉 #0  Menu principal\n',
    ],
    { capture: true },
     async (ctx,{gotoFlow, flowDynamic, fallBack, endFlow}) => {
            if (ctx.body == 0) { await gotoFlow(flowPrincipal) }

            if (ctx.body == 1) { 
                await flowDynamic(await service.listProductSelected());
                return await gotoFlow(flowLisSelectProducts);
            }
            
            if(ctx.body == 2){ 
                service.cleanData();
                return endFlow({body: '❌ Su solicitud ha sido cancelada, Cuando desee empezar un nuevo proceso de compra ingrese la palabra *Hola*'}) 
            }

            if (ctx.body == 3) { 
                await flowDynamic(await service.listProductSelected());
                return await gotoFlow(flowValidPromotionDelete);
            }

            if (![0, 1, 3].includes(parseInt(ctx.body.toLowerCase().trim()))) {
                return fallBack({body: "*Opcion no valida*, por favor seleccione una opcion valida."});
            }
         
     },
    // [flowLisSelectProducts]
 );



 const flowValidSelectProd = addKeyword('select')
 .addAnswer(
    [
        '*Procesamos su seleccion, indique El numero de su siguiente paso:*\n',
        '👉 #1  Resumen compras', 
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
            await flowDynamic(await service.listProductSelected());
            return await gotoFlow(flowLisSelectProducts);
        }
        
        if (ctx.body == 2) {
            await flowDynamic(await service.category());
            return await gotoFlow(flowCategory);
        }

        if (ctx.body == 3) { 
            await flowDynamic(await service.listProductSelected())
            return await gotoFlow(flowValidProductDelete)
        }

        if(ctx.body == 4){
            service.cleanData();
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
        'Digite la palabra *Volver* para ir al menu anterior',
    ],
    { capture: true},
    async(ctx, {gotoFlow, flowDynamic, endFlow, fallBack}) => {
        if (ctx.body.toLowerCase().trim() == 'volver' ) {
            return await gotoFlow(flowPrincipal)
        }

        const valid = await service.validSelectProductDelete(ctx.body);
        if (!valid) {
            console.log('validacion validSelectProductDelete ', valid)

            await flowDynamic(await service.deleteProducts(ctx.body, 'products'));

            const resultvalidListP = await service.validListProducts();
            console.log('validacion resultvalidList ', resultvalidListP)
            if (!resultvalidListP) {
                console.log('ingreso al if')
                // return await gotoFlow(FlowMenuPromocion);
                await flowDynamic(await service.category());
                return await gotoFlow(flowCategory);
            } else {
                // await flowDynamic(await service.getPromotion(ctx.body));
                // return await gotoFlow(flowPromotion);
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
        '\nIngrese la palabra *Volver* para ir al menu anterior',
    ],
    { capture: true},
    async(ctx, {gotoFlow, flowDynamic, endFlow, fallBack}) => {
        if (ctx.body.toLowerCase().trim() == 'volver' ) {
            return await gotoFlow(flowPrincipal)
        }

        const valid = await service.validSelectProductDelete(ctx.body);
        if (!valid) {
            // console.log('validacion validSelectProductDelete ', valid)

            await flowDynamic(await service.deleteProducts(ctx.body, 'promotion'));
            const resultvalidList = await service.validListProducts();
            console.log('validacion resultvalidList ', resultvalidList)
            if (resultvalidList) {
                return await gotoFlow(FlowMenuPromocion);
            } else {
                await flowDynamic(await service.getPromotion(ctx.body));
                return await gotoFlow(flowPromotion);
            }
            
        }
        // console.log('ctx.body.toLowerCase().trim() ', ctx.body.toLowerCase().trim())
        // if ([0].includes(parseInt(ctx.body.toLowerCase().trim()))) {
        //     return await gotoFlow(flowCategory)
        // }

        return fallBack({body: '❌ Debe indicar el codigo del producto que desea eliminar con una estructura valida Ejemplo 1,2,3'});
        
        
     },
 );

 
 const flowLisCategoryLacteos = addKeyword('Lacteos')
 .addAnswer(
    [
        'Indique los Numeros de los productos que desee y la cantidad, separados por una coma',
        'Ejemplo: 1:2,2:1,3:4',
        '\nIngrese la palabra *volver* para ir a la lista de categorias',
    ],
    { capture: true},
    async(ctx, {gotoFlow, flowDynamic, fallBack}) => {
        if (ctx.body.toLowerCase().trim() == 'volver' ) {
            await flowDynamic(await service.category());
            return await gotoFlow(flowCategory);
        }
        
        const valid = await service.validSelectProducts(ctx.body);
        if (valid) {
            console.log('validacion categorias ', valid)
            return fallBack({body: '❌ Debe indicar el numero de producto y cantidad con una estructura valida Ejemplo 1:3,2:4'});
            // return fallBack();
        }
        if (!valid) {
            await flowDynamic(await service.addproducts(ctx.body));
            return await gotoFlow(flowValidSelectProd);
        } 
        
        
        //  console.log('ctx.body.toLowerCase().trim() ', ctx.body.toLowerCase().trim())
        // if ([0].includes(parseInt(ctx.body.toLowerCase().trim()))) {
        //     return await gotoFlow(flowCategory)
        // }

        
     }
    )
 
 
 const flowCategory = addKeyword(['Categoria', 'Categorias', 'categoria', 'CATEGORIA'])
 .addAnswer(
    ['Ingrese la categoria'],
    { capture: true },
    async (ctx,{flowDynamic, gotoFlow, fallBack}) => {
        console.log('llego por aca flowcategory')
        if (ctx.body == 0) { return await gotoFlow(flowPrincipal) }
        const validCategory = await service.validSelectCategory(ctx.body);
        if (validCategory) {
            return fallBack({body: "*Opcion no valida*, por favor seleccione una opcion valida."});
        } else {
            await flowDynamic(await service.product(ctx.body));
            return await gotoFlow(flowLisCategoryLacteos);
        }
    },
//    [flowLisCategoryLacteos]
);

 const flowPromotion = addKeyword(['1', 'Promociones', 'Promocion', 'promociones', 'promocion'])
 .addAnswer(
    [
        '*Indique el numero de las Promociones que desee y la cantidad separadas por coma Ejemplo: 1:2,3:2*\n', 
        'Indique la palabra *volver* para ir al menu principal',
    ],
     { capture: true},
     async (ctx, {gotoFlow, flowDynamic, endFlow, fallBack}) => {
        if (ctx.body.toLowerCase().trim() == 'volver' ) {
            return await gotoFlow(flowPrincipal)
        }
        
        let valid = await service.validSelectPromotion(ctx.body);
        if (!valid) {
            // console.log('ingreso al if negado', valid)
            await flowDynamic( await service.addPromotions(ctx.body));
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
        'Seleccione una opcion para avanzarss:\n',
        '👉 #1  Resumen Compras',
        '👉 #2  Eliminar Productos', 
        '👉 #3  Cancelar Compra',
        '👉 #0  Menu principal\n',  
    ],
    { capture: true },
     async (ctx,{gotoFlow, flowDynamic, fallBack, endFlow}) => {
        console.log('llego por aca flowValidSelectPromotion')
            if (ctx.body == 0) { return await gotoFlow(flowPrincipal) }

            if (ctx.body == 1) { 
                await flowDynamic(await service.listProductSelected());
                return await gotoFlow(flowLisSelectProducts);
            }

            if (ctx.body == 2) { 
                await flowDynamic(await service.listProductSelected())
                return await gotoFlow(flowValidPromotionDelete)
            }
            
            if(ctx.body == 3){ 
                service.cleanData();
                return endFlow({body: '❌ Su solicitud ha sido cancelada, Cuando desee empezar un nuevo proceso de compra ingrese la palabra *Hola*'}) 
            }
            if (![0, 1, 2].includes(parseInt(ctx.body.toLowerCase().trim()))) {
                return fallBack({body: "*Opcion no valida*, por favor seleccione una opcion valida."});
            }
         
     },
    // [flowLisSelectProducts]
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
        service.cleanData();
        return endFlow({body: '*Gracias*'});
    }
);

const FlowAgente2 = addKeyword(['4', 'Agente', 'AGENTE'])
.addAnswer(["*Estamos desviando tu conversacion a nuestro Agente*"], null,
   async(ctx, {provider, endFlow}) => {
    console.log('ctx', ctx.key?.remoteJid)
    //    const nanoid = await required('nanoid')
    //    const ID_GROUP = nanoid.nanoid(5)
    STATUS = false;
    const name = ctx.pushName;
    const numAgente = ctx.key?.remoteJid;
    const message = `El cliente ${name} con el celular ${numAgente} solicita atencion mas personalizada`;
    // const message = `El cliente  con el celular  solicita atencion mas personalizada`;
    const refProvider = await provider.getInstance();
    // await refProvider.sendMessage(numAgente, {Text: message});
    provider.sendText('56936499908@s.whatsapp.net', message)
       service.cleanData();
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



/**
* Declarando flujo principal
*/
const flowPrincipal = addKeyword(EVENTS.WELCOME)
 .addAnswer([
    '🏜️ Hola, Bienvenido a *Minimarket Los Medanos* 🌵', 
    '⌛ Horario disponible desde las 8:00 AM hasta las 10:00 PM. ⌛',
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
     async (ctx,{gotoFlow, flowDynamic, fallBack}) => {
        if (ctx.body === "1") {
            await flowDynamic(await service.getPromotion(ctx.body));
            return await gotoFlow(flowPromotion); 
        }
         if (ctx.body === "3") {
            await flowDynamic(await service.category());
            return await gotoFlow(flowCategory);
         }
        if (![1, 2, 3, 4].includes(parseInt(ctx.body.toLowerCase().trim()))) {
            return fallBack({body: "*Opcion no valida*, por favor seleccione una opcion valida."});
        }
     },
    [flowLink, FlowAgente2]
 )

const main = async () => {
    const adapterDB = new MongoAdapter({
        dbUri: MONGO_DB_URI,
        dbName: MONGO_DB_NAME,
    })
    const adapterFlow = createFlow([
        flowPrincipal, 
        flowLisCategoryLacteos, 
        flowLisSelectProducts,
        flowValidSelectProd,
        flowEndShoppingCart,
        flowCategory,
        flowValidSelectProd,
        FlowMenuPromocion,
        flowValidPromotionDelete,
        flowValidProductDelete,
        flowPromotion
    ]);
    
    const adapterProvider = createProvider(BaileysProvider)
    createBot({
        provider: adapterProvider,
        database: adapterDB,
        flow: adapterFlow,
    })
    
    QRPortalWeb()
           
}

main()



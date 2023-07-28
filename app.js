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
        'Nombre Callle Numeracion Dto/Bloque/Lote Referencia\n',
    ],
    { capture: true},
    async(ctx, {flowDynamic, endFlow}) => {
        if (ctx.body.length > 0) {
            await flowDynamic(await service.saveOrder(ctx))
            service.cleanData();
            return endFlow({body: 'Gracias'})
        }
    }
 );

 
 const flowLisSelectProducts = addKeyword(['2', 'Resumen Compras', , 'resumen compras'])
 .addAnswer(
    [
        'opciones disponibles para avanzar:\n',
        '👉 #1  Concretar Compra',
        '👉 #2  Cancelar Compra',
        '👉 #0  Menu principal\n', 
    ],
     { capture: true},
     
     async(ctx, {flowDynamic, fallBack, endFlow, gotoFlow}) => {
        if (ctx.body == 0) {
            await gotoFlow(flowPrincipal)
        }
        
        if (ctx.body == 1) { await gotoFlow(flowEndShoppingCart)}
        
        if(ctx.body == 2){ return endFlow({body: '❌ Su pedido ha sido cancelado'}) }

        // if(ctx.body != 1 &&  ctx.body != 2 && ctx.body !=3){
        //     console.log('ingreso aca fallBack', ctx.body)
        //     return fallBack();
        // }
        if (![0, 1, 2].includes(parseInt(ctx.body.toLowerCase().trim()))) {
            service.cleanData();
            return fallBack({body: "*Opcion no valida*, por favor seleccione una opcion valida."});
        }
     },
    // [flowEndShoppingCart]
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
        '👉 #0  Menu principal\n',
    ],
    { capture: true },
     async (ctx,{gotoFlow, flowDynamic, fallBack, endFlow}) => {
            if (ctx.body == 0) { await gotoFlow(flowPrincipal) }

            if (ctx.body == 1) { 
                await flowDynamic(await service.listProductSelected())
            }
            
            if(ctx.body == 2){ 
                service.cleanData();
                return endFlow({body: '❌ Su pedido ha sido cancelado'}) 
            }

            if (![0, 1, 2].includes(parseInt(ctx.body.toLowerCase().trim()))) {
                return fallBack({body: "*Opcion no valida*, por favor seleccione una opcion valida."});
            }
         
     },
    [flowLisSelectProducts]
 )

 const flowValidSelectProd = addKeyword('select')
 .addAnswer(
    [
        '*Procesamos su seleccioneeeess, indique El numero de su siguiente paso:*\n',
        '👉 #1  Resumen compras', 
        '👉 #2  Categorias',
        '👉 #3  Cancelar Compra', 
        '👉 #0  Menu principal\n',
    ],
    { capture: true},
    async(ctx, {gotoFlow, flowDynamic, endFlow, fallBack}) => {
        if (ctx.body == 0) {
            return await gotoFlow(flowPrincipal)
        }
        
        if (ctx.body == 1) {
            await flowDynamic(await service.listProductSelected());
            return await gotoFlow(flowLisSelectProducts);
        }
        
        if (ctx.body == 2) {
            await flowDynamic(await service.category())
            return await gotoFlow(flowCategory)
        }

        if(ctx.body == 3){
            console.log('ingreso aca cancelar compra')
            service.cleanData();
            return endFlow({body: '❌ Su solicitud ha sido cancelada'})
        }
        if (![0, 1, 2, 3].includes(parseInt(ctx.body.toLowerCase().trim()))) {
            return fallBack({body: "*Opcion no valida*, por favor seleccione una opcion valida."});
        }
     },
 );

 const flowLisCategoryLacteos = addKeyword('Lacteos')
 .addAnswer(
    [
        'Indique los Numeros de los productos que desee y la cantidad, separados por coma',
        'Ejemplo: 1:2,2:1,3:4',
        'Para *volver* a las categorias digite *0*',
    ],
    { capture: true},
    async(ctx, {gotoFlow, flowDynamic, fallBack}) => {
        if ([0].includes(parseInt(ctx.body.toLowerCase().trim()))) {
            return await gotoFlow(flowCategory)
        }
        const valid = await service.validSelectProducts(ctx.body);
        if (!valid) {
            await flowDynamic(await service.addproducts(ctx.body))
            return await gotoFlow(flowValidSelectProd)
        }

        return fallBack({body: '❌ Debe indicar el numero de producto y cantidad con una estructura valida Ejemplo 1:3,2:4'});
     }
    )
 
 
 const flowCategory = addKeyword(['3', 'Categoria', 'Categorias', 'categoria', 'CATEGORIA'])
 .addAnswer(
    null,
    { capture: true },
    async (ctx,{flowDynamic, gotoFlow, fallBack}) => {
        // if (ctx.body == 0) { return await gotoFlow(flowPrincipal) }
        const validCategory = await service.validSelectCategory(ctx.body);
        if (validCategory) {
            return fallBack({body: "*Opcion no valida*, por favor seleccione una opcion valida."});
        }
        await flowDynamic(await service.product(ctx.body))
        return await gotoFlow(flowLisCategoryLacteos)
    },
//    [flowLisCategoryLacteos]
);

 const flowPromotion = addKeyword(['1', 'Promociones', 'Promocion', 'promociones', 'promocion'])
 .addAnswer(
    [
        '*Indique el numero de las Promociones que desee separadas por coma Ejemplo: 1:2*\n', 
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
            await flowDynamic( await service.addPromotions(ctx.body))
        }
        if (valid) {
            return fallBack({body: '❌ Debe indicar los pproductos y cantidad con una estructura valida'});
        }
         
     },
 ).addAnswer(
    [
        'Procesamos su seleccion, indique El numero de su siguiente paso:.\n',
        '👉 #1  Resumen compras', 
        '👉 #2  Cancelar Compra\n',
        '👉 #0  Menu principal',  
    ],
    { capture: true },
     async (ctx,{gotoFlow, flowDynamic, fallBack, endFlow}) => {
        console.log('llego por aca flowValidSelectPromotion')
            if (ctx.body == 0) { return await gotoFlow(flowPrincipal) }

            if (ctx.body == 1) { return await flowDynamic(await service.listProductSelected())}
            
            if(ctx.body == 2){ 
                service.cleanData();
                return endFlow({body: '❌ Su pedido ha sido cancelado'}) 
            }
            if (![0, 1, 2].includes(parseInt(ctx.body.toLowerCase().trim()))) {
                return fallBack({body: "*Opcion no valida*, por favor seleccione una opcion valida."});
            }
         
     },
    [flowLisSelectProducts]
 )

 const FlowAgente = addKeyword(['4', 'Agente', 'AGENTE'])
 .addAnswer(["*Estamos desviando tu conversacion a nuestro agente*"], null,
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
.addAnswer(["*Estamos desviando tu conversacion a nuestro agente*"], null,
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
        'En el siguiente Link tendras la opcion de realizar El pedido de los productos requeridos:', 
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
        '👉 #2 Link Carrito de compra', 
        '👉 #3 Carrito de compra whatsApp',
        '👉 #4 Conversar con un Agente'
    ],
    { capture: true },
     async (ctx,{flowDynamic, fallBack}) => {
        if (ctx.body === "1") {
            await flowDynamic(await service.getPromotion(ctx.body))
        }
         if (ctx.body === "3") {
            // console.log('ingreso al if', ctx.body)
            await flowDynamic(await service.category())
         }
        if (![1, 2, 3, 4].includes(parseInt(ctx.body.toLowerCase().trim()))) {
            return fallBack({body: "*Opcion no valida*, por favor seleccione una opcion valida."});
        }
     },
    [flowCategory, flowPromotion, flowLink, FlowAgente2]
 )

const main = async () => {
    const adapterDB = new MongoAdapter({
        dbUri: MONGO_DB_URI,
        dbName: MONGO_DB_NAME,
    })
    const adapterFlow = createFlow([
        flowPrincipal, 
        flowLisCategoryLacteos, 
        flowValidSelectProd,
        flowEndShoppingCart
    ])
    // const adapterFlow = createFlow([flowvCard, opt1, opt2,opt3,opt4])
    // const adapterFlow = createFlow([flowPrincipalVenta])
    // const adapterFlow = createFlow([flowEndS])
    
    const adapterProvider = createProvider(BaileysProvider)
    createBot({
        provider: adapterProvider,
        database: adapterDB,
        flow: adapterFlow,
    })
    
    QRPortalWeb()
           
}

main()

















// const { createBot, createProvider, createFlow, addKeyword, addChild, EVENTS, addAnswer, addAction } = require('@bot-whatsapp/bot')

// const QRPortalWeb = require('@bot-whatsapp/portal')
// const BaileysProvider = require('@bot-whatsapp/provider/baileys')
// const MongoAdapter = require('@bot-whatsapp/database/mongo')
// const productSchema = require("./src/models/products.models");
// // 
// const axios = require('axios');
// const { addTransactionCapability } = require('@adiwajshing/baileys');
// var fs = require('fs');
// /**
//  * Declaramos las conexiones de Mongo
//  */

// // const MONGO_DB_URI = 'mongodb://0.0.0.0:27017'
// const MONGO_DB_URI = 'mongodb+srv://molledafreddy:freddy2..@cluster0.1e16p.mongodb.net'
// const MONGO_DB_NAME = 'db_bot';

// const url = 'http://localhost:3002';
// const limit = 5
// const page = 1;
// const search = '';
// const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NDYyYmQ4M2E2MzY3YTdkMTkxZDEyYTMiLCJyb2xlIjoiQWRtaW4iLCJpYXQiOjE2ODY2MTYwNDgsImV4cCI6MTY4NjYyMzI0OH0.79tnt-lxT7jxBPCvMGTqFA16BWDYZZR3YEA1GosqUgc'
// let dataCategory;

// let contaninerIdCategory = [];
// let contaninerProductos = [];
// let categorySelectActive = [];
// let lastContainerProducts = [];
// let lastContainerPromotions = [];


// const cleanData = async () => {
//     contaninerIdCategory = [];
//     contaninerProductos = [];
//     categorySelectActive = [];
//     lastContainerProducts = [];
//     lastContainerPromotions = [];
// }

// /**
//  * Conexion servicio API
//  */
// const getData = async () => {
    
//     const extend = 'bank'
//     return await axios.get(
//         `${url}/${extend}?limit=${limit}&page=${page}&search=${search}`,
//     { headers: {"Authorization" : `Bearer ${token}`} });
// }
// /**
//  * Conexion servicio API Crear un Delivery
//  */
//  const postDelivery = async (body) => {
//     const extend = 'product/delivery'
//     return await axios.post(
//         `${url}/${extend}?`, body,
//     { headers: {"Authorization" : `Bearer ${token}`} });
// }

// /**
//  * Conexion servicio API Categorias
//  */
//  const getCategory = async () => {
    
//     const extend = 'product/category'
//     return await axios.get(
//         `${url}/${extend}`,
//         // { headers: {"Authorization" : `Bearer ${token}`} }
//     );
// }

// /**
//  * Conexion servicio API Categorias
//  */
//  const getProducts = async (idCategory, clasification) => {
    
//     const extend = 'product';
//     // console.log('url', `${url}/${extend}/${idCategory}/${clasification}`)
//     return await axios.get(
//         `${url}/${extend}/${idCategory}/${clasification}`,
//         // { headers: {"Authorization" : `Bearer ${token}`} }
//     );
// }

// const category = async ()  => {
//     const categories = await getCategory();
//     // console.log('categoies', categories.data)
//      let data= [];
//     // const mapDatos = catgories.data.map((c) => ({body: `${c.name}`}))
//         data.push("*Categorias Disponibles*");
//         data.push("\n*Indique el numero de la categoria de su interes*")
//         let contador = 1
        
//         categories.data.forEach(c => {
//             // console.log('contador', c)
//             if (c._id !== '64adedb4035179d0b5492fe1') {
//                 let value =`\n 👉#: ${contador} ${c.name}`
//                 data.push(value)
//                 contaninerIdCategory.push({name: c.name, id: c._id, numberCategory: contador});
//                 value = '';
//             }
//             contador++;
//         });
//         // console.log('contaninerIdCategory', contaninerIdCategory)
//         // console.log('categoies data', data)
//         // // console.log('data', data)
//         data.push(`\n 👉#: 0 Volver al menu Principal`)
//         dataCategory =  {body: `${data}`}
//         const cat = {body: `${data}`}
//         // console.log('contaninerIdCategory', contaninerIdCategory)
//         return cat;
// }

// const addproducts = async (selected)  => { 
//     let products = selected.split(',');
//     // console.log('addproducts produtcs', products)
//     let containerSelected = [];
//     products.forEach(element => {
//         // containerSelected
//         let divider = element.split(':');
//         containerSelected.push({
//             numberProduct: divider[0],
//             quantity: divider[1],
//         })

//         // console.log('element datos divider',divider)
//     });
//     // console.log('containerSelected', containerSelected)

//     if (containerSelected.length > 0) {
//         // categorySelectActive
//         // console.log('categorySelectActive', categorySelectActive)
//         containerSelected?.forEach(element => {
//             // console.log('containerSelected', element)
//             // console.log('contaninerProductos', contaninerProductos)
//             contaninerProductos?.forEach(elementP => {
//                 if (element.numberProduct == elementP.counter && categorySelectActive.id == elementP.category) {
//                     elementP.quantity = element.quantity;
//                     elementP.status = true;
//                 }
                
//             });
//         });
//     }
//     console.log('contaninerProductos', contaninerProductos)
//     // products.forEach(element => {
//     //     console.log('element', element)
//     //     contaninerIdCategory.forEach(element2 => {
//     //         console.log('element2', element2)
//     //         if (element == element) {
                
//     //         }
//     //     });
//     // });
//     // const found = contaninerIdCategory.find(element => element.numberCategory == `${selected}`);
//     // contaninerIdCategory[selected].products.push({name: c.name, id: c._id, price: contador})
// }

// const validSelectPromotion = async (selected)  => { 
//     let products = selected.split(',');
//     let containerSelected = [];
//     let flag = false;
//     products.forEach(element => {
//         // containerSelected
//         let divider = element.split(':');
//         containerSelected.push({
//             numberProduct: divider[0],
//             quantity: divider[1],
//         })

//         // console.log('element datos divider',divider)
//     });
//     // console.log('containerSelected', containerSelected)
//     // console.log('lastContainerPromotions', lastContainerPromotions)
//     containerSelected.forEach(elementS => {
//         if (isNaN(elementS.numberProduct) || elementS.quantity === undefined || elementS.quantity === '') {
//             flag = true;
//             // return true;
//         }
//         console.log('elementS', elementS)
//         const found = lastContainerPromotions.find(element => element == elementS.numberProduct);
//         if (found == undefined) {
//             flag = true;
//             // console.log('ingreso al if foud undefined', found)
//             // return "ingreso un valor incorrrecto";
            
//         }
//         console.log('valor foud', found)
//     });

//     return flag

// }

// const validSelectCategory = async (selected)  => { 
//     // console.log('valor selected', selected)
//     // let products = selected.split(',');
//     let containerSelected = [];
//     let flag = false;
//     contaninerIdCategory.forEach(element => {
//         // containerSelected
//         // let divider = element.split(':');
//         containerSelected.push(element.numberCategory)

//         // console.log('element datos divider',divider)
//     });
//     console.log('containerSelected', containerSelected)
//     if (!containerSelected.includes(parseInt(selected.toLowerCase().trim()))) {
//         console.log('imngreso al if')
//         flag = true;
    
//     }
//     console.log('flag', flag)
//     return flag

// }

// const validSelectProducts = async (selected)  => { 
//     console.log('lastContainerProducts', lastContainerProducts)
//     let products = selected.split(',');
//     let containerSelected = [];
//     let flag = false;
//     products.forEach(element => {
//         // containerSelected
//         let divider = element.split(':');
//         containerSelected.push({
//             numberProduct: divider[0],
//             quantity: divider[1],
//         })

//         // console.log('element datos divider',divider)
//     });
    
//     containerSelected.forEach(elementS => {
//         console.log('elementS.quantity', elementS.quantity)
//         if (isNaN(elementS.numberProduct) || elementS.quantity == undefined || elementS.quantity == '') {
//             console.log('ijgreso al if')
//             flag = true;
//             // return true;
//         }
//         // console.log('elementS', elementS)
//         const found = lastContainerProducts.find(element => element == elementS.numberProduct);
//         if (found == undefined) {
//             flag = true;
//             // console.log('ingreso al if foud undefined', found)
//             // return "ingreso un valor incorrrecto";
            
//         }
        
//         console.log('valor foud', found)
//     });
//     console.log('valor flag', flag)
//     return flag

// }

// const addPromotions2 = async (selected)  => { 
//     const products = selected.split(',');
//     console.log('products addPromotions2', products);
//     if (products.length > 0) {
//         products.forEach(element => {
//             contaninerProductos?.forEach(elementP => {
//                 if (element == elementP.counter) {
//                     elementP.status = true;
//                 }
//             });
//         });
//     }
//     console.log('contaninerProductos', contaninerProductos)
// }

// const addPromotionsQuantity = async (selected)  => { 
//     const products = selected.split(',');
//     let containerSelected = [];
//     console.log('products', products);
//     if (products.length > 0) {
//         products.forEach(element => {
//             contaninerProductos?.forEach(elementP => {
//                 if (element == elementP.counter) {
//                     elementP.status = true;
//                 }
//             });
//         });
//     }
    
   
// }

// const addPromotions = async (selected)  => { 
//     let products = selected.split(',');
//     let containerSelected = [];

//     products.forEach(element => {
//         // containerSelected
//         let divider = element.split(':');
//         containerSelected.push({
//             numberProduct: divider[0],
//             quantity: divider[1],
//         })

//         // console.log('element datos divider',divider)
//     });
    
//     if (containerSelected.length > 0) {
//         // categorySelectActive
//         // console.log('categorySelectActive', categorySelectActive)
//         containerSelected?.forEach(element => {
//             // console.log('containerSelected', element)
//             // console.log('contaninerProductos', contaninerProductos)
//             contaninerProductos?.forEach(elementP => {
//                 if (element.numberProduct == elementP.counter) {
//                     elementP.quantity = element.quantity;
//                 }
                
//             });
//         });
//     }
//     // return "sim problemas";
//     console.log('contaninerProductos', contaninerProductos)
// }

// const saveOrder = async (ctx)  => {
//     let dataProducts = {
//         products: [],
//         address: "",
//         longitude: "",
//         latitude: "",
//         phone: "",
//         nameClient: "",
//     }
        
//     ;
//     let data = [];
//     console.log('dataProducts', dataProducts)
//     contaninerProductos?.forEach(c => {
//         if (c.quantity > 0) {
//             dataProducts.products.push({
//                 "_id": c._id,
//                 "name": c.name,
//                 "price": c.price,
//                 "category": c.category,
//                 "quantity": c.quantity
//             });
//         }
//     });
//     dataProducts.address = ctx?.message?.conversation;
//     dataProducts.latitude = ctx?.message?.locationMessage?.degreesLatitude;
//     dataProducts.longitude = ctx?.message?.locationMessage?.degreesLongitude;
//     dataProducts.phone = ctx?.from;
//     dataProducts.nameClient = ctx?.pushName;
//     data.push(`\n🙌Su pedido fue exitoso, le contactara un operador para Validar El Pedido🙌`);
//     console.log('dataProducts', dataProducts)
//     postDelivery(dataProducts);
//     return {body: `${data}`}
//  }

//  const getPromotion = async (selected)  => {
//     // console.log('llego a las promociones getPromotion')
//     const products = await getProducts("64adedb4035179d0b5492fe1", "promotion");
//     // console.log('llego a las promociones products', products?.data)
//     let data= [];
//     data.push("Promociones Disponibles");
//     // data.push("\nIndique el numero de producto de su interes:");
//     let counter = 1
//     lastContainerPromotions = [];
//     products?.data.forEach(c => {
//         // console.log('c procategoryProductsductos', c)
//         let value =`\n 👉# ${counter}: *${c.name}* ${c.description} Price:${c.price}\n`
//         data.push(value)
//         lastContainerPromotions.push(counter)
//         let result = contaninerProductos.findIndex(elementP => {
//             if (elementP._id == c._id) {
//                 return true
//             }
//         })

//         if (result == -1) {
//             contaninerProductos.push({
//                 "_id": c._id,
//                 "name": c.name,
//                 "nameView": value,
//                 "counter": counter,
//                 "price": c.price,
//                 "category": c.categoryProducts[0],
//                 "quantity": 0,
//                 "status": false
//             })
//         }
//         value = '';
//         counter++;
//     });
    
//     const prod = {body: `${data}`}
//     // console.log('contaninerProductos', contaninerProductos)
//     // console.log('lastContainerPromotions', lastContainerPromotions)
    
//     // console.log('categorySelectActive', categorySelectActive)
//     return prod;
//  }

//  const product = async (selected)  => {
//     // console.log('product selected', selected)
//     const found = contaninerIdCategory.find(element => element.numberCategory == `${selected}`);
//     if ( found !== undefined && found?.id !== undefined ) {
//         // console.log('ingreso al if validacion', found.id)
//         categorySelectActive = found;
//         lastContainerProducts = [];
//         const products = await getProducts(found.id, "regular");
//         let data= [];
//         // const mapDatos = catgories.data.map((c) => ({body: `${c.name}`}))
//             data.push("Productos Disponibles");
//             data.push("\nIndique el numero de producto de su interes:");
//             let counter = 1;
//             products.data.forEach(c => {
//                 // console.log('c procategoryProductsductos', c)
//                 let value =`\n 👉#: ${counter} ${c.name} Price:${c.price}`
//                 data.push(value)
//                 lastContainerProducts.push(counter)
//                 let result = contaninerProductos.findIndex(elementP => {
//                     if (elementP._id == c._id) {
//                         return true
//                     }
//                 })

//                 if (result == -1) {
//                     contaninerProductos.push({
//                         "_id": c._id,
//                         "name": c.name,
//                         "nameView": value,
//                         "counter": counter,
//                         "price": c.price,
//                         "category": c.categoryProducts[0],
//                         "quantity": 0,
//                         "status": false
//                     })
//                 }
//                 value = '';
//                 counter++;
//             });
//             // console.log('lastContainerProducts', lastContainerProducts)
//             const prod = {body: `${data}`}
//             return prod;
//     }


    
// }

// const listProductSelected = async (selected)  => {
//     let data= [];
//     data.push("Productos Seleccionados\n\n");
//     let counter = 1
//     let sumProducts = 0;
//     console.log('listProductSelected lelgo')
//     contaninerProductos.forEach(c => {
//         if (c.quantity != 0) {
//             let value =`👉: ${c.name} Cantidad:${c.quantity}  Precio:${c.price}\n`
//             data.push(value)
//             sumProducts =  ( parseFloat(sumProducts) + (parseFloat(c.price) * parseFloat(c.quantity)))
//         }

//         value = '';
//         counter++;
//     });
    
//     const formatter = new Intl.NumberFormat('en-US', {
//         style: 'currency',
//         minimumFractionDigits: 3,
//         currency:"CLP"
//     }) 
    
//     const dollar = formatter.format(sumProducts);
//     data.push(`\nTotal a Pagar: ${dollar}`);
//     return {body: `${data}`}
// }

// const listProductPreSelected = async (selected)  => {
//     let data= [];
//     data.push("Indique en orden la cantidad por cada combo seleccionado\n\n");
//     let counter = 1
//     // let sumProducts = 0;
//     contaninerProductos.forEach(c => {
//         if (c.quantity == 0 && c.status) {
//             let value =`👉:#${counter} ${c.name}  Precio:${c.price}\n`
//             data.push(value)
//         }
//         value = '';
//         counter++;
//     });
    
//     return {body: `${data}`}
// }

// const mensajesDB = async ()  => {
//     // const categories = db.find(...)
//     // const responseItem = await productSchema.find();
//     // return responseItem;
//     // const products = productSchema.find();
//     const banks = await getData();
//     const mapDatos = banks.data.map((c) => ({body: `${c.name} ${c.description}`}))
//     // const mapDatos = banks.data.map((c) => {

//     // })
//     // console.log('mapDatos', mapDatos)
//     return mapDatos[0]

//     // console.log('resultD', resultD.data)
//     // console.log('products', products)
//     // const mapDatos = categories.map((c) => ({body:c.name}))
//     // return mapDatos
// }


// const flowEndShoppingCart = addKeyword(EVENTS.LOCATION)
//  .addAnswer(
//     [
//         'Ingrese su direccion con la siguiente estructura:\n',
//         'Nombre Callle Numeracion Dto/Bloque/Lote Referencia\n',
//     ],
//     { capture: true},
//     async(ctx, {flowDynamic, endFlow}) => {
//         if (ctx.body.length > 0) {
//             await flowDynamic(await saveOrder(ctx))
//             cleanData();
//             return endFlow({body: 'Gracias'})
//         }
//     }
//  );

 
//  const flowLisSelectProducts = addKeyword(['2', 'Resumen Compras', , 'resumen compras'])
//  .addAnswer(
//     [
//         'opciones disponibles para avanzar:\n',
//         '👉 #1  Concretar Compra',
//         '👉 #2  Cancelar Compra',
//         '👉 #0  Menu principal\n', 
//     ],
//      { capture: true},
     
//      async(ctx, {flowDynamic, fallBack, endFlow, gotoFlow}) => {
//         if (ctx.body == 0) {
//             await gotoFlow(flowPrincipal)
//         }
        
//         if (ctx.body == 1) { await gotoFlow(flowEndShoppingCart)}
        
//         if(ctx.body == 2){ return endFlow({body: '❌ Su pedido ha sido cancelado'}) }

//         // if(ctx.body != 1 &&  ctx.body != 2 && ctx.body !=3){
//         //     console.log('ingreso aca fallBack', ctx.body)
//         //     return fallBack();
//         // }
//         if (![0, 1, 2].includes(parseInt(ctx.body.toLowerCase().trim()))) {
//             cleanData();
//             return fallBack({body: "*Opcion no valida*, por favor seleccione una opcion valida."});
//         }
//      },
//     // [flowEndShoppingCart]
//  );

 
// const flowValidSelectPromotion = addKeyword(EVENTS.WELCOME)
//  .addAnswer([
//     '🏜️ Hola, Bienvenido a *Minimarket Los Medanos* 🌵', 
//     '⌛ Horario disponible desde las 8:00 AM hasta las 10:00 PM. ⌛',
//     '📝 a través de este canal te ofrecemos los siguientes servicios de compra:'
    
// ])
//  .addAnswer(
//     [
//         'Procesamos su seleccion, indique El numero de su siguiente paso:.\n',
//         '👉 #1  Resumen compras', 
//         '👉 #2  Cancelar Compra', 
//         '👉 #0  Menu principal\n',
//     ],
//     { capture: true },
//      async (ctx,{gotoFlow, flowDynamic, fallBack, endFlow}) => {
//             if (ctx.body == 0) { await gotoFlow(flowPrincipal) }

//             if (ctx.body == 1) { 
//                 await flowDynamic(await listProductSelected())
//             }
            
//             if(ctx.body == 2){ 
//                 cleanData();
//                 return endFlow({body: '❌ Su pedido ha sido cancelado'}) 
//             }

//             if (![0, 1, 2].includes(parseInt(ctx.body.toLowerCase().trim()))) {
//                 return fallBack({body: "*Opcion no valida*, por favor seleccione una opcion valida."});
//             }
         
//      },
//     [flowLisSelectProducts]
//  )

//  const flowValidSelectProd = addKeyword('select')
//  .addAnswer(
//     [
//         '*Procesamos su seleccioneeeess, indique El numero de su siguiente paso:*\n',
//         '👉 #1  Resumen compras', 
//         '👉 #2  Categorias',
//         '👉 #3  Cancelar Compra', 
//         '👉 #0  Menu principal\n',
//     ],
//     { capture: true},
//     async(ctx, {gotoFlow, flowDynamic, endFlow, fallBack}) => {
//         if (ctx.body == 0) {
//             return await gotoFlow(flowPrincipal)
//         }
        
//         if (ctx.body == 1) {
//             await flowDynamic(await listProductSelected());
//             return await gotoFlow(flowLisSelectProducts);
//         }
        
//         if (ctx.body == 2) {
//             await flowDynamic(await category())
//             return await gotoFlow(flowCategory)
//         }

//         if(ctx.body == 3){
//             console.log('ingreso aca cancelar compra')
//             cleanData();
//             return endFlow({body: '❌ Su solicitud ha sido cancelada'})
//         }
//         if (![0, 1, 2, 3].includes(parseInt(ctx.body.toLowerCase().trim()))) {
//             return fallBack({body: "*Opcion no valida*, por favor seleccione una opcion valida."});
//         }
//      },
//  );

//  const flowLisCategoryLacteos = addKeyword('Lacteos')
//  .addAnswer(
//     [
//         'Indique los Numeros de los productos que desee y la cantidad, separados por coma',
//         'Ejemplo: 1:2,2:1,3:4',
//         'Para *volver* a las categorias digite *0*',
//     ],
//     { capture: true},
//     async(ctx, {gotoFlow, flowDynamic, fallBack}) => {
//         if ([0].includes(parseInt(ctx.body.toLowerCase().trim()))) {
//             return await gotoFlow(flowCategory)
//         }
//         const valid = await validSelectProducts(ctx.body);
//         if (!valid) {
//             await flowDynamic(await addproducts(ctx.body))
//             return await gotoFlow(flowValidSelectProd)
//         }

//         return fallBack({body: '❌ Debe indicar el numero de producto y cantidad con una estructura valida Ejemplo 1:3,2:4'});
//      }
//     )
 
 
//  const flowCategory = addKeyword(['3', 'Categoria', 'Categorias', 'categoria', 'CATEGORIA'])
//  .addAnswer(
//     null,
//     { capture: true },
//     async (ctx,{flowDynamic, gotoFlow, fallBack}) => {
//         if (ctx.body == 0) { return await gotoFlow(flowPrincipal) }
//         const validCategory = await validSelectCategory(ctx.body);
//         if (validCategory) {
//             return fallBack({body: "*Opcion no valida*, por favor seleccione una opcion valida."});
//         }
//         await flowDynamic(await product(ctx.body))
//         return await gotoFlow(flowLisCategoryLacteos)
//     },
// //    [flowLisCategoryLacteos]
// );

 
 
// //  const flowMostRequested = addKeyword(
// //     ['2', 'Productos mas solicitados', 'mas solicitados', 'solicitados', 'promocion'])
// //  .addAnswer(
// //     [
// //         'Productos mas solicitados:', 
// //         '\n👉 #1 🥫 Kétchup 100 gr PRECIO: 8.000$', 
// //         '\n👉 #2 🍟 Papas Hijo 8.000$', 
// //         '\n👉 #3 🍞 Panquete pan 10 Un PRECIO: 8.000$', 
// //         '\n👉 #4 🥓 Paquete vianesas 20 un PRECIO: 8.000$', 
// //         '\n👉 #5 🥥 Cocossette PRECIO: 1.800$', 
// //         '\n👉 #6 🫓 Harina Pan 1k PRECIO: 6.000$' , 
// //         '\n👉 #7 🧀 Queso llanero 500 gr PRECIO: 6.000$' , 
// //         '\n👉 #8 🧈 Mantequilla 500 gr PRECIO: 6.000$' , 
// //         '\n👉 #9 🥓 Jamon 500 gr PRECIO: 6.000$' , 
// //         '\n👉 #10 🥖 Pan Completo 20 un 4.000$',
// //         '\n👉 #11  🥑 Palta 500 gr PRECIO: 4.000$',
        
// //     ],
// //      { capture: true},
// //      (ctx) => {
// //          console.log('Aqui puedes ver más info del usuario...')
// //          console.log('Puedes enviar un mail, hook, etc..')
// //          console.log(ctx)
// //      },
// //     //  [...addChild(flowZapatos2)]
// //     // [flowZapatos2]
// //  )

// //  const flowMostSlectPromotionQuantity = addKeyword(
// //     ['2', 'Productos mas solicitados', 'mas solicitados', 'solicitados', 'promocion'])
// //  .addAnswer(
// //     [
// //         'Listo\n',
// //     ]
// //     // null
// //     ,
// //     { capture: true },
// //      async (ctx,{gotoFlow, flowDynamic, fallBack, endFlow}) => {
        
// //         await flowDynamic( addPromotionsQuantity(ctx.body))
// //             // if (ctx.body == 1) { await gotoFlow(flowPrincipal) }

// //             // if (ctx.body == 2) { await flowDynamic(await listProductSelected())}

// //             // if (ctx.body == 3) { await gotoFlow(flowEndShoppingCart)}
            
// //             // if(ctx.body == 3){ return endFlow({body: '❌ Su pedido ha sido cancelado'}) }

// //             // if(ctx.body != 3 && ctx.body != 2 && ctx.body != 1 ){
// //             //     console.log('ingreso al ultimo if',[ ctx.body])
// //             //     return fallBack();
// //             // }
         
// //      },
// //     // [flowLisSelectProducts]
// //  )
 
//  const flowPromotion = addKeyword(['1', 'Promociones', 'Promocion', 'promociones', 'promocion'])
//  .addAnswer(
//     [
//         '*Indique el numero de las Promociones que desee separadas por coma Ejemplo: 1:2*\n', 
//         'Indique la palabra *volver* para ir al menu principal',
        
//     ],
//      { capture: true},
//      async (ctx, {gotoFlow, flowDynamic, endFlow, fallBack}) => {
//         if (ctx.body.toLowerCase().trim() == 'volver' ) {
//             return await gotoFlow(flowPrincipal)
//         }
        
//         let valid = await validSelectPromotion(ctx.body);
//         if (!valid) {
//             // console.log('ingreso al if negado', valid)
//             await flowDynamic( await addPromotions(ctx.body))
//         }
//         if (valid) {
//             return fallBack({body: '❌ Debe indicar los pproductos y cantidad con una estructura valida'});
//         }
         
//      },
//  ).addAnswer(
//     [
//         'Procesamos su seleccion, indique El numero de su siguiente paso:.\n',
//         '👉 #1  Resumen compras', 
//         '👉 #2  Cancelar Compra\n',
//         '👉 #0  Menu principal',  
//     ],
//     { capture: true },
//      async (ctx,{gotoFlow, flowDynamic, fallBack, endFlow}) => {
//         console.log('llego por aca flowValidSelectPromotion')
//             if (ctx.body == 0) { return await gotoFlow(flowPrincipal) }

//             if (ctx.body == 1) { return await flowDynamic(await listProductSelected())}
            
//             if(ctx.body == 2){ 
//                 cleanData();
//                 return endFlow({body: '❌ Su pedido ha sido cancelado'}) 
//             }
//             if (![0, 1, 2].includes(parseInt(ctx.body.toLowerCase().trim()))) {
//                 return fallBack({body: "*Opcion no valida*, por favor seleccione una opcion valida."});
//             }
         
//      },
//     [flowLisSelectProducts]
//  )

//  const FlowAgente = addKeyword(['4', 'Agente', 'AGENTE'])
//  .addAnswer(["*Estamos desviando tu conversacion a nuestro agente*"], null,
//     async(ctx, {provider, endFlow}) => {
//         const nanoid = await required('nanoid')
//         const ID_GROUP = nanoid.nanoid(5)
//         const refProvider = await provider.getInstance()
//         await refProvider.groupCreate(`Los Medanos Atencion (${ID_GROUP})`, [
//             `${ctx.from}@s.whatsapp.net`
//         ])
//         cleanData();
//         return endFlow({body: '*Gracias*'});
//     }
// );

// const FlowAgente2 = addKeyword(['4', 'Agente', 'AGENTE'])
// .addAnswer(["*Estamos desviando tu conversacion a nuestro agente*"], null,
//    async(ctx, {provider, endFlow}) => {
//     console.log('ctx', ctx.key?.remoteJid)
//     //    const nanoid = await required('nanoid')
//     //    const ID_GROUP = nanoid.nanoid(5)
//     STATUS = false;
//     const name = ctx.pushName;
//     const numAgente = ctx.key?.remoteJid;
//     const message = `El cliente ${name} con el celular ${numAgente} solicita atencion mas personalizada`;
//     // const message = `El cliente  con el celular  solicita atencion mas personalizada`;
//     const refProvider = await provider.getInstance();
//     // await refProvider.sendMessage(numAgente, {Text: message});
//     provider.sendText('56936499908@s.whatsapp.net', message)
//        cleanData();
//        return endFlow({body: '*Gracias*'});
//    }
// );

//  const flowLink = addKeyword(['2', 'Link', 'link'])
//  .addAnswer(
//     [
//         'En el siguiente Link tendras la opcion de realizar El pedido de los productos requeridos:', 
//         '🔗 *https://www.almacenesdigitales.cl/Ecommerce.xhtml?almacen=4361*', 
//     ],
//     null,
//      (ctx,{ endFlow }) => {  return endFlow({body: 'Gracias'}); }
//  )



// /**
// * Declarando flujo principal
// */
// const flowPrincipal = addKeyword(EVENTS.WELCOME)
//  .addAnswer([
//     '🏜️ Hola, Bienvenido a *Minimarket Los Medanos* 🌵', 
//     '⌛ Horario disponible desde las 8:00 AM hasta las 10:00 PM. ⌛',
//     '📝 a través de este canal te ofrecemos los siguientes servicios de compra:'
    
// ])
//  .addAnswer(
//      [
//         '*Indica el Número de la opción que desees:*', 
//         '👉 #1 Promociones', 
//         '👉 #2 Link Carrito de compra', 
//         '👉 #3 Carrito de compra whatsApp',
//         '👉 #4 Conversar con un Agente'
//     ],
//     { capture: true },
//      async (ctx,{flowDynamic, fallBack}) => {
//         if (ctx.body === "1") {
//             await flowDynamic(await getPromotion(ctx.body))
//         }
//          if (ctx.body === "3") {
//             // console.log('ingreso al if', ctx.body)
//             await flowDynamic(await category())
//          }
//         if (![1, 2, 3, 4].includes(parseInt(ctx.body.toLowerCase().trim()))) {
//             return fallBack({body: "*Opcion no valida*, por favor seleccione una opcion valida."});
//         }
//      },
//     [flowCategory, flowPromotion, flowLink, FlowAgente2]
//  )

// const main = async () => {
//     const adapterDB = new MongoAdapter({
//         dbUri: MONGO_DB_URI,
//         dbName: MONGO_DB_NAME,
//     })
//     const adapterFlow = createFlow([
//         flowPrincipal, 
//         flowLisCategoryLacteos, 
//         flowValidSelectProd,
//         flowEndShoppingCart
//     ])
//     // const adapterFlow = createFlow([flowvCard, opt1, opt2,opt3,opt4])
//     // const adapterFlow = createFlow([flowPrincipalVenta])
//     // const adapterFlow = createFlow([flowEndS])
    
//     const adapterProvider = createProvider(BaileysProvider)
//     createBot({
//         provider: adapterProvider,
//         database: adapterDB,
//         flow: adapterFlow,
//     })
    
//     QRPortalWeb()
           
// }

// main()


const axios = require('axios');
require("dotenv").config();
const flowAgenteNotification = require('../flows/flowAgenteNotification');
const globalState = require('../../state/globalState');

const URL = process.env.URL;
const limit = 5
const page = 1;
const search = '';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NDYyYmQ4M2E2MzY3YTdkMTkxZDEyYTMiLCJyb2xlIjoiQWRtaW4iLCJpYXQiOjE2ODY2MTYwNDgsImV4cCI6MTY4NjYyMzI0OH0.79tnt-lxT7jxBPCvMGTqFA16BWDYZZR3YEA1GosqUgc'


/**
 * Metodo que permite limpiar los contenedores cuando de cancela o termina el flujo.
 */
const cleanData = async (ctx) => {
    globalState.update(ctx.from, {
        contaninerIdCategory: [],
        lastContainerProducts:[],
        contaninerProductos: [],
        categorySelectActive: {},
        lastContainerPromotions: []
    });
}

/**
 * Conexion servicio API Crear un Pedido (Delivery)
 */
 const postDelivery = async (body) => {
    try {
        const extend = 'product/delivery'
        return await axios.post(
            `${URL}/${extend}?`, body,
        { headers: {"Authorization" : `Bearer ${token}`} });
    } catch (error) {
        console.log('nuevo error', error)
    }
   
}

/**
 * Conexion servicio API Categorias
 */
 const getProducts = async (idCategory, clasification) => {

    try {
        const extend = 'product';
        const status = true;
        return await axios.get(
            `${URL}/${extend}/${idCategory}/${clasification}/${status}`,
            // { headers: {"Authorization" : `Bearer ${token}`} }
        );    
    } catch (error) {
        console.log('genero error', error)
    }
    
    
}

/**
 * Conexion servicio API Categorias
 */
 const getCategory = async () => {
    
    try {
        const extend = 'product/category'
        return await axios.get(
            `${URL}/${extend}`,
            // { headers: {"Authorization" : `Bearer ${token}`} }
        );
    } catch (error) {
        console.log('error', error)
    }
}

/**
 * Metodo que permite consultar y construir la lista de categorias
 */
const category = async (ctx)  => {
    const categories = await getCategory();
     let data= [];
     let containerCategory = [];
    // const mapDatos = catgories.data.map((c) => ({body: `${c.name}`}))
        data.push("*Categorias Disponibles*");
        data.push("\n*Indique el numero de la categoria de su interes*")
        let contador = 1
        categories.data.forEach(c => {
            if (c._id !== '64adedb4035179d0b5492fe1') {
                let value =`\n 👉#: ${contador} ${c.name}`
                data.push(value)
                containerCategory.push({name: c.name, id: c._id, numberCategory: contador});
                
                value = '';
                contador++;
            }
        });
       
        globalState.update(ctx.from, {
            contaninerIdCategory: containerCategory
        });

        data.push(`\n 👉#: 0 Volver al menu Principal`);
        const cat = [{body: `${data}`}]
        return cat;
}

/**
 * Metodo que permite agregar los productos seleccionados al contenedor
 */
const addproducts = async (ctx)  => { 

    let productsGlobal = ctx?.body.split(',');
    let contaninerProductosGlobal = globalState.get(ctx.from)?.contaninerProductos ?? [];
    let containerSelectedGlobal = [];
    
    productsGlobal.forEach(element => {
        let dividerG = element.split(':');
        containerSelectedGlobal.push({
            numberProduct: dividerG[0],
            quantity: dividerG[1],
        });
    });

    if (containerSelectedGlobal.length > 0) {
        containerSelectedGlobal?.forEach(element => {
            contaninerProductosGlobal?.forEach(elementP => {

                if (element.numberProduct == elementP.counter && globalState.get(ctx.from)?.categorySelectActive.id == elementP.category) {
                    // console.log('element.numberProductGlobal',element.numberProduct)
                    // console.log('elementP.counterGlobal',elementP.counter)
                    // console.log('categorySelectActive.idGlobal',globalState.get(ctx.from)?.categorySelectActive.id)
                    // console.log('elementP.categoryGlobal',elementP.category)
                    elementP.quantity = element.quantity;
                    elementP.status = true;
                }
                
            });
        });
    }
}

/**
 * Metodo que permite eliminar productos seleccionados
 */
 const deleteProducts = async (ctx, type)  => { 
    let products = ctx?.body.split(',');
    
    products.forEach(elementS => {
        globalState.get(ctx.from).contaninerProductos.forEach(element => {
            if (element.counter == elementS && element.type === type) {
                element.quantity = 0;
            }
            
        });
    });

    return globalState.get(ctx.from).contaninerProductos;
}

/**
 * Metodo que permite validar si los datos ingresados para seleccionar la promocion son validos
 */
 const validSelectProductDelete = async (ctx)  => { 
    let products = ctx?.body.split(',');
    let containerSelected = [];
    let flag = false;
    products.forEach(element => {
        if (isNaN(element)) {
            flag = true;
        }
    });
    return flag;
}

/**
 * Metodo que permite validar si los datos ingresados para seleccionar la promocion son validos
 */
 const validListProducts = async (ctx)  => { 
    let flagGlobal = false;
    globalState.get(ctx?.from)?.contaninerProductos.forEach(elementG => {
        if (elementG?.quantity > 0 ) {
            flagGlobal = true;
        }
    });
    return flagGlobal;
}

/**
 * Metodo que permite validar si los datos ingresados para seleccionar la promocion son validos
 */
const validSelectPromotion = async (ctx)  => { 
    let products = ctx?.body.split(',');
    let containerSelectedGlobal = [];
    let flag = false;
    products.forEach(element => {
        let divider = element.split(':');
        containerSelectedGlobal.push({
            numberProduct: divider[0],
            quantity: divider[1],
        });
    });

    containerSelectedGlobal.forEach(elementS => {
        if (isNaN(elementS.numberProduct) || elementS.quantity === undefined || elementS.quantity === '') {
            flag = true;
        }
        
        const found = globalState.get(ctx.from).lastContainerPromotions?.find(element => element == elementS.numberProduct);
        if (found == undefined) {
            flag = true;
        }
    });
    return flag;
}

/**
 * Metodo que permite agregar las promociones seleccionadas
 */
const addPromotions = async (ctx)  => { 

    let products = ctx?.body.split(',');
    let containerSelected = [];

    products.forEach(element => {
        let divider = element.split(':');
        containerSelected.push({
            numberProduct: divider[0],
            quantity: divider[1],
        });
    });
    
    if (containerSelected.length > 0) {
        let globalcontaninerProductos = globalState.get(ctx.from)?.contaninerProductos;
        containerSelected?.forEach(element => {
            globalcontaninerProductos.forEach(elementP => {
                if (element.numberProduct == elementP.counter && elementP.type === 'promotion') {
                    elementP.quantity = element.quantity;
                }
            });
        });
        globalState.update(ctx.from, {
            contaninerProductos: globalcontaninerProductos
        });
    }
}

/**
 * Metodo que permite validar si los datos ingresados para seleccionar la categoria son validos
 */
const validSelectCategory = async (ctx)  => { 
    let GcontainerSelected = [];
    let flag = false;
    let Gflag = false;
    let globalContaninerIdCategory = globalState.get(ctx.from).contaninerIdCategory
    globalContaninerIdCategory.forEach(elementG => {
        GcontainerSelected.push(elementG.numberCategory);
    });

    if (!GcontainerSelected.includes(parseInt(ctx.body.toLowerCase().trim()))) {
        Gflag = true;
    }
    return Gflag;
}

/**
 * Metodo que permite validar si los datos ingresados para seleccionar las productos son validos
 */
const validSelectProducts = async (ctx)  => { 
    let products = ctx.body.split(',');
    let containerSelected = [];
    let flag = false;
    products.forEach(element => {
        let divider = element.split(':');
        containerSelected.push({
            numberProduct: divider[0],
            quantity: divider[1],
        })
    });
    
    containerSelected.forEach(elementS => {
        if (isNaN(elementS.numberProduct) || elementS.quantity == undefined || elementS.quantity == '') {
            flag = true;
        }
        
        const found = globalState.get(ctx.from)?.lastContainerProducts.find(element => element == elementS.numberProduct);
        if (found == undefined) {
            flag = true;
        }
    });

    let productsGlobal = ctx.body.split(',');
    let containerSelectedGlobal = [];
    let flagGlobal = false;
    productsGlobal.forEach(element => {
        let dividerGlobal = element.split(':');
        containerSelectedGlobal.push({
            numberProduct: dividerGlobal[0],
            quantity: dividerGlobal[1],
        })
    });
    
    containerSelectedGlobal.forEach(elementS => {
        if (isNaN(elementS.numberProduct) || elementS.quantity == undefined || elementS.quantity == '') {
            flag = true;
        }
        let lastContainerProductsGlobal = globalState.get(ctx.from)?.lastContainerProducts;
        const foundGlobal = lastContainerProductsGlobal.find(element => element == elementS.numberProduct);
        if (foundGlobal == undefined) {
            flagGlobal = true;
        }
    });


    return flag;
}

const messageRead = async (ctx, provider)  => {
    // const lastMsgInChat = await getLastMessageInChat('123456@s.whatsapp.net') // implement this on your end
    // mark it unread
    const refProvider = await provider.getInstance();
    // console.log('refProvider', provider)
    // await refProvider.groupCreate(`Los Medanos Atencion (${ID_GROUP})`, [
    //     `${ctx.from}@s.whatsapp.net`
    // ])
    // service.cleanData(ctx);
    // const lastMsgInChat = await getLastMessageInChat('56936499908@s.whatsapp.net') // implement this on your end
    // console.log('lastMsgInChat', lastMsgInChat)
    // mark it unread
    // ctx?.key?.remoteJid
await refProvider.chatModify({ markRead: false, lastMessages: [ctx.message] }, '56949079809@s.whatsapp.net')

    // const lastMsgInChat = await provider.getLastMessageInChat('56936499908@s.whatsapp.net', dataMessageGlobal.toString());
    // await provider.chatModify({ markRead: false, lastMessages: [lastMsgInChat] }, '123456@s.whatsapp.net')
}

/**
 * Metodo que permite guardar un delivery
 */
const saveOrder = async (ctx, provider)  => {
    try {
        let dataProductsGlobal = {
            products: [],
            address: "",
            longitude: "",
            latitude: "",
            phone: "",
            nameClient: "",
        };
    
        let dataGlobal = [];
        let dataMessageGlobal = [];
        dataMessageGlobal.push(`* 🛒 Se Registro un nuevo pedido con la siguiente informacion: 🛒* \n`);
        dataMessageGlobal.push(`*Nombre Cliente:* ${ctx?.pushName} \n *Telefono:* +${ctx?.from} \n`);
        dataMessageGlobal.push(`* Direccion:* ${ctx?.message?.conversation} \n`);
        let globalcontaninerProductos = globalState.get(ctx.from)?.contaninerProductos
        globalcontaninerProductos?.forEach(c => {
            if (c.quantity > 0) {
                dataProductsGlobal.products.push({
                    "_id": c._id,
                    "name": c.name,
                    "price": c.price,
                    "category": c.category,
                    "quantity": c.quantity
                });
                dataMessageGlobal.push(` *Nombre:* ${c.name} *Precio: * ${c.price} *Cantidad:* ${c.quantity} \n`);
            }
        });
    
        dataProductsGlobal.address = ctx?.message?.conversation;
        dataProductsGlobal.latitude = ctx?.message?.locationMessage?.degreesLatitude;
        dataProductsGlobal.longitude = ctx?.message?.locationMessage?.degreesLongitude;
        dataProductsGlobal.phone = ctx?.from;
        dataProductsGlobal.nameClient = ctx?.pushName;
        console.log('dataProductsGlobal', dataProductsGlobal)
        postDelivery(dataProductsGlobal);
    
        dataGlobal.push(`🥳 🛒Su pedido fue Exitoso, sera contactado por un Agente para validar la informacion suministrada 🛒 🥳`);
        dataGlobal.push(`Si requiere realizar un cambio del pedido lo podra hacer cuando se comunique con el Agente.`);
        await provider.sendText('56926070900@s.whatsapp.net', dataMessageGlobal.toString());
        await provider.sendText('56936499908@s.whatsapp.net', dataMessageGlobal.toString());
        
        await cleanData(ctx);
        return [{body: `${dataGlobal}`}]
    } catch (error) {
        console.log('error', error)
    }

    
}

/**
 * Metodo que permite consultar las promociones
 */
const getPromotion = async (ctx)  => {

    const products = await getProducts("64adedb4035179d0b5492fe1", "promotion");
    
    let data= [];
    // data.push("Promociones Disponibles");
    let counter = 1
    lastContainerPromotionsGlobal = [];
    let contaninerProductosGlobal = globalState.get(ctx.from)?.contaninerProductos ?? [];
    globalState.update(ctx.from, {
        lastContainerPromotions: []
    });
    products?.data.forEach(c => {
        let value =`\n 👉 ${counter}: *${c.name}* ${c.description} Precio:${c.price}\n`
        data.push(value)
        lastContainerPromotionsGlobal.push(counter)
        let result = contaninerProductosGlobal.findIndex(elementP => {
            if (elementP._id == c._id) {
                return true
            }
        })

        if (result == -1) {
            contaninerProductosGlobal.push({
                "_id": c._id,
                "name": c.name,
                "nameView": value,
                "counter": counter,
                "price": c.price,
                "category": c.categoryProducts[0],
                "quantity": 0,
                "type": "promotion",
                "status": false
            })
        }
        value = '';
        counter++;
    });

    globalState.update(ctx.from, {
        contaninerProductos: contaninerProductosGlobal,
        lastContainerPromotions: lastContainerPromotionsGlobal
    });
    
    const prod = [{body: `${data}`}];
    return prod;
}

/**
 * Metodo que permite consultar y crear la lista de productos
 */
const product = async (ctx)  => {
    const foundGlobal = globalState.get(ctx.from).contaninerIdCategory.find(element => element.numberCategory == `${ctx.body}`);
    
    if ( foundGlobal !== undefined && foundGlobal?.id !== undefined ) {
        globalState.update(ctx.from, {
            categorySelectActive: foundGlobal
        });

        let contaninerProductosGlobal = globalState.get(ctx.from)?.contaninerProductos ?? [];
        let lastContainerProductsGlobal = [];
        globalState.update(ctx.from, {
            lastContainerProducts: []
        });
        const products = await getProducts(foundGlobal.id, "regular");
        let dataGlobal= [];
            dataGlobal.push("Productos Disponibles");
            dataGlobal.push("\nIndique el numero de producto de su interes:");
            let counterGlobal = 1;
            products.data.forEach(c => {
                let valueGlobal =`\n 👉 ${counterGlobal}: ${c.name} Precio:${c.price}`
                dataGlobal.push(valueGlobal)
                lastContainerProductsGlobal.push(counterGlobal);
                let result = contaninerProductosGlobal.findIndex(elementP => {
                    if (elementP._id == c._id) {
                        return true
                    }
                })

                if (result == -1) {
                    contaninerProductosGlobal.push({
                        "_id": c._id,
                        "name": c.name,
                        "nameView": valueGlobal,
                        "counter": counterGlobal,
                        "price": c.price,
                        "category": c.categoryProducts[0],
                        "quantity": 0,
                        "type": "products",
                        "status": false
                    })
                }
                valueGlobal = '';
                counterGlobal++;
            });

            globalState.update(ctx.from, {
                contaninerProductos: contaninerProductosGlobal,
                lastContainerProducts: lastContainerProductsGlobal
            });
            const prodGlobal = [{body: `${dataGlobal}`}]
            return prodGlobal;
    }
}

/**
 * Metodo que muestra la lista de productos previamente seleccionados
 */
const listProductSelected = async (ctx)  => {
    let dataGlobal= [];

    dataGlobal.push("*Productos Seleccionados*\n\n");

    let counterGlobal = 1
    let sumProductsGlobal = 0;
    let contaninerProductosGlobal = globalState.get(ctx.from)?.contaninerProductos ?? [];
    contaninerProductosGlobal.forEach(c => {
        if (c.quantity != 0) {
            let valueG =`👉 ${counterGlobal}: Nombre: ${c.name} Cantidad:${c.quantity}  Precio:${c.price}\n`
            dataGlobal.push(valueG)
            sumProductsGlobal =  ( parseFloat(sumProductsGlobal) + (parseFloat(c.price) * parseFloat(c.quantity)))
        }
        valueG = '';
        counterGlobal++;
    });

    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        minimumFractionDigits: 3,
        currency:"CLP"
    });

    const dollarG = formatter.format(sumProductsGlobal);
    dataGlobal.push(`\nTotal a Pagar: ${dollarG}`)
    // dataGlobal = `Total a Pagar: ${dollarG}`;
    return [{body: `${dataGlobal}`}]
}

/**
 * Metodo que muestra la lista de productos previamente seleccionados
 */
const listProductPreSelected = async (selected)  => {
    let data= [];
    data.push("Indique en orden la cantidad por cada combo seleccionado\n\n");
    let counter = 1
    contaninerProductos.forEach(c => {
        if (c.quantity == 0 && c.status) {
            let value =`👉 ${counter}: ${c.name}  Precio:${c.price}\n`
            data.push(value)
        }
        value = '';
        counter++;
    });
    
    return [{body: `${data}`}]
}

module.exports = { cleanData, messageRead, validListProducts, validSelectProductDelete, deleteProducts, listProductPreSelected, listProductSelected, product, getPromotion, saveOrder, validSelectProducts, validSelectCategory, postDelivery, getCategory, category, addproducts, validSelectPromotion, addPromotions }

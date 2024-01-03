
const axios = require('axios');
require("dotenv").config();
const globalState = require('../../state/globalState');

const URL = process.env.URL;
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NDYyYmQ4M2E2MzY3YTdkMTkxZDEyYTMiLCJyb2xlIjoiQWRtaW4iLCJpYXQiOjE2ODY2MTYwNDgsImV4cCI6MTY4NjYyMzI0OH0.79tnt-lxT7jxBPCvMGTqFA16BWDYZZR3YEA1GosqUgc'


/**
 * Metodo que permite limpiar los contenedores cuando de cancela o termina el flujo.
 */
const cleanData = async (ctx) => {
    globalState.update(ctx.from, {
        contaninerProductCatalogo: [],
        activeCatalog: null
    });
}

/**
 * Conexion servicio API Crear un Pedido (Delivery)
 */
 const postDelivery = async (body) => {
    try {
        const extend = 'product/delivery';
        return await axios.post(
            `${URL}/${extend}?`, body,
        { headers: {"Authorization" : `Bearer ${token}`} });
    } catch (error) {
        console.log('nuevo error', error)
    }
   
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

        const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            minimumFractionDigits: 0,
            currency:"CLP"
        });
    
        let dataGlobal = [];
        let dataMessageGlobal = [];
        let detail = [];
        let sumProductsGlobal = 0;

        dataMessageGlobal.push(`* 🛒 Se Registro un nuevo pedido con la siguiente informacion: 🛒* \n`);
        dataMessageGlobal.push(`*Nombre Cliente:* ${ctx?.pushName} \n *Telefono:* +${ctx?.from} \n`);
        dataMessageGlobal.push(`* Direccion:* ${ctx?.message?.conversation} \n`);
        
        let globalcontaninerProductos = globalState.get(ctx.from)?.contaninerProductCatalogo
        await globalcontaninerProductos?.forEach(c => {
            if (c.quantity > 0) {
               
                dataProductsGlobal.products.push({
                    "_id": null,
                    "name": c.name,
                    "price": formatter.format(c.price),
                    "category": null,
                    "quantity": c.quantity
                });
                
                dataMessageGlobal.push(` *Nombre:* ${c.name} *Precio: * ${formatter.format(c.price)} *Cantidad:* ${c.quantity} \n`);
                detail.push(` Nombre: ${c.name} Precio: ${formatter.format(c.price)} Cantidad: ${c.quantity} \n`);
                sumProductsGlobal =  ( parseFloat(sumProductsGlobal) + (parseFloat(c.price) * parseFloat(c.quantity)))
            }
        });
       
        dataProductsGlobal.address = ctx?.message?.conversation;
        dataProductsGlobal.latitude = ctx?.message?.locationMessage?.degreesLatitude;
        dataProductsGlobal.longitude = ctx?.message?.locationMessage?.degreesLongitude;
        dataProductsGlobal.phone = ctx?.from;
        dataProductsGlobal.nameClient = ctx?.pushName;
        await postDelivery(dataProductsGlobal);
       
        dataGlobal.push(`🥳 🛒Su pedido fue Exitoso, sera contactado por un Agente para validar la informacion suministrada 🛒 🥳`);
        dataGlobal.push(`\n\n*Detalle del Pedido:*\n`);
        dataGlobal.push(detail.toString());

        const dollarG = formatter.format(sumProductsGlobal);
        dataGlobal.push(`\n*Total a Pagar: ${dollarG}*`)
        dataGlobal.push(`\n\nSi requiere realizar un cambio del pedido lo podra hacer cuando nuestro Agente se comunique con Usted.`);
        dataMessageGlobal.push(`\n*Total a Pagar: ${dollarG}*`)
        
        await provider.sendText('56926070900@s.whatsapp.net', dataMessageGlobal.toString());
        await provider.sendText('56936499908@s.whatsapp.net', dataMessageGlobal.toString());
        
        await cleanData(ctx);
        return [{body: `${dataGlobal}`}]
    } catch (error) {
        console.log('error', error)
    }

    
}

/**
 * Metodo que permite capturar los productos seleccionados en el catalogo
 */
 const addOrderCatalog = async (ctx)  => {
    try {
        const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            minimumFractionDigits: 0,
            currency:"CLP"
        });
    
        let containerSelected = [];
        if (ctx?.details?.products.length > 0) {
            await ctx?.details?.products?.forEach(element => {
                containerSelected.push({
                    id: element?.id,
                    name: element?.name,
                    price: element?.price,
                    currency: element?.currency,
                    quantity: element?.quantity
                    
                });
            });

            await globalState.update(ctx.from, {
                contaninerProductCatalogo: containerSelected
            });

            globalState.get(ctx.from)?.contaninerProductCatalogo;
        }
    } catch (error) {
        console.log('error', error)
    }
}

module.exports = { addOrderCatalog, cleanData, saveOrder, postDelivery }

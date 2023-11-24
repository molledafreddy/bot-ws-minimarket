const { addKeyword, addAnswer, EVENTS } = require('@bot-whatsapp/bot')
// const flowEndShopingCart = require('./flowEndShopingCart');
// const service = require('../services/productService');

const flowTienda = addKeyword(EVENTS.ORDER)
.addAction(async (ctx,{flowDynamic, gotoFlow, provider})=>{
    console.log("flowtienda");
    try {
        
        console.log('flowtienda',ctx);
            // if (ctx.message.hasOwnProperty('orderMessage')) {
            //     //  const refProvider = await provider.getInstance();
            //      // await refProvider.sendPresenceUpdate('recording', ctx?.key?.id); 
            //     await flowDynamic("Procesando su orden...");
            //     await flowDynamic(await service.addOrderCatalog(ctx))
            //     console.log('se ejecuto el flujo de tienda')
            //     return await gotoFlow(flowEndShopingCart);
            // }
    } catch (error) {
        console.log('error tienda', error)
    }

})

module.exports = flowTienda
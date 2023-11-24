const { addKeyword, addAnswer, EVENTS } = require('@bot-whatsapp/bot')
const flowAgente = require('./flowAgente');
const service = require('../services/productService');

const flowEndShoppingCart = addKeyword(EVENTS.ACTION)
 .addAnswer(
    [
        'Su orden fue procesada:\n\n',
        'Ingrese su direccion con la siguiente estructura:\n',
        '*Nombre Calle Numeracion, Comuna, Dto/Bloque/Lote Referencia*\n',
    ],
    { capture: true,  delay: 4000, idle: 20000 },
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
        console.log('ctx', ctx)
        if (ctx?.body?.length > 0) {
            await flowDynamic(await service.saveOrder(ctx, provider))
            service.cleanData(ctx);
            return endFlow({body: 'Gracias por su Compra'})
        }
    }
 );

module.exports = flowEndShoppingCart
const { addKeyword } = require('@bot-whatsapp/bot')


const FlowAgente = addKeyword(['4', 'Agente', 'AGENTE'])
.addAnswer(["*Estamos desviando tu conversacion a nuestro Agente*"], null,
   async(ctx, {provider, endFlow}) => {
    // STATUS = false;
    // console.log('datos', ctx?.from)
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

module.exports = FlowAgente
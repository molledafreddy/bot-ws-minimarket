const { addKeyword, addAnswer, addAction } = require('@bot-whatsapp/bot')


const FlowAgenteNotification = addKeyword(['4', 'Agente', 'AGENTE'])
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

module.exports = FlowAgenteNotification
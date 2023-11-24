const { addKeyword, addAnswer, EVENTS } = require('@bot-whatsapp/bot')
const moment = require("moment");
const globalState = require('../../state/globalState');
const flowAlertPrincipal = require('./flowAlertPrincipal');
const flowPrincipal = require('./flowPrincipal');
const flowDisable = require('./flowDisable');

const flowValidTime = addKeyword(EVENTS.WELCOME)
.addAction(async(ctx,{gotoFlow, provider}) => {
     try {
        const refProvider = await provider.getInstance();
        await refProvider.sendPresenceUpdate('recording', ctx?.key?.id); 
        // let contaninerProductosGlobal = globalState.get(ctx.from)?.activeCatalog ?? null;
        
        // await refProvider.readMessages([ctx?.key]);
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

module.exports = flowValidTime
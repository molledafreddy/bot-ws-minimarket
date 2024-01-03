// TODO - ESTE ES EL FLUJO QUE SE ACTIVARÁ SI EL TIEMPO SE CONSUME
const { addKeyword, EVENTS } = require("@bot-whatsapp/bot");
const service = require('./services/productService');

const flowInactividad = addKeyword(EVENTS.ACTION).addAction(
  async (ctx, { endFlow }) => {
    service.cleanData(ctx);
    return endFlow('❌  *Finalizado por inactividad* ❌ \n\n Para iniciar el proceso de Pedido debe Escribir la palabra: *Hola* \n\n*Gracias por Comunicarte*');
  }
);
// TODO ----------------------------------------------------------
// Objeto para almacenar temporizadores por usuario
const timers = {};


// Función para iniciar el temporizador
function startInactividad(ctx, gotoFlow, tiempo) {
  console.log('llego al start inactiviti')
  timers[ctx.from] = setTimeout(() => {
    console.log(`¡Tiempo agotado para el usuario ${ctx.from}!`);
    return gotoFlow(flowInactividad); // 🚩🚩🚩 PEGA AQUÍ TU FLUJO (en mi caso flowInactividad)
    // Aquí puedes manejar la lógica correspondiente al vencimiento del tiempo
  }, tiempo);
}


// Función para reiniciar el temporizador
function resetInactividad(ctx, gotoFlow, tiempo) {
  // Si ya hay un temporizador en marcha para el usuario, lo cancelamos
  console.log('resetInactividad con tiempo de ', tiempo)
  stopInactividad(ctx);
  if (timers[ctx.from]) {
    console.log(`REINICIAMOS cuenta atrás para el usuario ${ctx.from}!`);
    clearTimeout(timers[ctx.from]);
  }
  // Iniciamos un nuevo temporizador
  startInactividad(ctx, gotoFlow, tiempo);
}

// Función para detener el temporizador
function stopInactividad(ctx) {
    // Si hay un temporizador en marcha para el usuario, lo cancelamos
    if (timers[ctx.from]) {
      console.log('se paro la stopInactividad');
      clearTimeout(timers[ctx.from]);
    }
  }
  
  
module.exports = {
    startInactividad,
    resetInactividad,
    stopInactividad,
    flowInactividad,
};
  

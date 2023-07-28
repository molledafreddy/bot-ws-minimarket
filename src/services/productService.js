
const axios = require('axios');
require("dotenv").config();

const URL = process.env.URL;
const limit = 5
const page = 1;
const search = '';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NDYyYmQ4M2E2MzY3YTdkMTkxZDEyYTMiLCJyb2xlIjoiQWRtaW4iLCJpYXQiOjE2ODY2MTYwNDgsImV4cCI6MTY4NjYyMzI0OH0.79tnt-lxT7jxBPCvMGTqFA16BWDYZZR3YEA1GosqUgc'


let contaninerIdCategory = [];
let contaninerProductos = [];
let categorySelectActive = [];
let lastContainerProducts = [];
let lastContainerPromotions = [];


/**
 * Metodo que permite limpiar los contenedores cuando de cancela o termina el flujo.
 */
const cleanData = async () => {
    contaninerIdCategory = [];
    contaninerProductos = [];
    categorySelectActive = [];
    lastContainerProducts = [];
    lastContainerPromotions = [];
}

/**
 * Conexion servicio API Crear un Pedido (Delivery)
 */
 const postDelivery = async (body) => {
    const extend = 'product/delivery'
    return await axios.post(
        `${URL}/${extend}?`, body,
    { headers: {"Authorization" : `Bearer ${token}`} });
}

/**
 * Conexion servicio API Categorias
 */
 const getProducts = async (idCategory, clasification) => {
    
    const extend = 'product';
    // console.log('url', `${url}/${extend}/${idCategory}/${clasification}`)
    return await axios.get(
        `${URL}/${extend}/${idCategory}/${clasification}`,
        // { headers: {"Authorization" : `Bearer ${token}`} }
    );
}

/**
 * Conexion servicio API Categorias
 */
 const getCategory = async () => {
    
    const extend = 'product/category'
    return await axios.get(
        `${URL}/${extend}`,
        // { headers: {"Authorization" : `Bearer ${token}`} }
    );
}

/**
 * Metodo que permite consultar y construir la lista de categorias
 */
const category = async ()  => {
    const categories = await getCategory();
    // console.log('categoies', categories.data)
     let data= [];
    // const mapDatos = catgories.data.map((c) => ({body: `${c.name}`}))
        data.push("*Categorias Disponibles*");
        data.push("\n*Indique el numero de la categoria de su interes*")
        let contador = 1
        
        categories.data.forEach(c => {
            // console.log('contador', c)
            if (c._id !== '64adedb4035179d0b5492fe1') {
                let value =`\n 👉#: ${contador} ${c.name}`
                data.push(value)
                contaninerIdCategory.push({name: c.name, id: c._id, numberCategory: contador});
                value = '';
            }
            contador++;
        });
        data.push(`\n 👉#: 0 Volver al menu Principal`)
        dataCategory =  {body: `${data}`}
        const cat = {body: `${data}`}
        // console.log('contaninerIdCategory', contaninerIdCategory)
        return cat;
}

/**
 * Metodo que permite agregar los productos seleccionados al contenedor
 */
const addproducts = async (selected)  => { 
    let products = selected.split(',');
    // console.log('addproducts produtcs', products)
    let containerSelected = [];
    products.forEach(element => {
        // containerSelected
        let divider = element.split(':');
        containerSelected.push({
            numberProduct: divider[0],
            quantity: divider[1],
        });
    });

    if (containerSelected.length > 0) {
        containerSelected?.forEach(element => {
            contaninerProductos?.forEach(elementP => {
                if (element.numberProduct == elementP.counter && categorySelectActive.id == elementP.category) {
                    elementP.quantity = element.quantity;
                    elementP.status = true;
                }
                
            });
        });
    }
}

/**
 * Metodo que permite validar si los datos ingresados para seleccionar la promocion son validos
 */
const validSelectPromotion = async (selected)  => { 
    let products = selected.split(',');
    let containerSelected = [];
    let flag = false;
    products.forEach(element => {
        let divider = element.split(':');
        containerSelected.push({
            numberProduct: divider[0],
            quantity: divider[1],
        });
    });

    containerSelected.forEach(elementS => {
        if (isNaN(elementS.numberProduct) || elementS.quantity === undefined || elementS.quantity === '') {
            flag = true;
        }
        
        const found = lastContainerPromotions.find(element => element == elementS.numberProduct);
        if (found == undefined) {
            flag = true;
        }
    });
    return flag;
}

/**
 * Metodo que permite agregar las promociones seleccionadas
 */
const addPromotions = async (selected)  => { 
    let products = selected.split(',');
    let containerSelected = [];

    products.forEach(element => {
        let divider = element.split(':');
        containerSelected.push({
            numberProduct: divider[0],
            quantity: divider[1],
        });
    });
    
    if (containerSelected.length > 0) {
        containerSelected?.forEach(element => {
            contaninerProductos?.forEach(elementP => {
                if (element.numberProduct == elementP.counter) {
                    elementP.quantity = element.quantity;
                }
            });
        });
    }
}

/**
 * Metodo que permite validar si los datos ingresados para seleccionar la categoria son validos
 */
const validSelectCategory = async (selected)  => { 
    let containerSelected = [];
    let flag = false;
    contaninerIdCategory.forEach(element => {
        containerSelected.push(element.numberCategory);
    });
    if (!containerSelected.includes(parseInt(selected.toLowerCase().trim()))) {
        flag = true;
    }
    return flag;
}

/**
 * Metodo que permite validar si los datos ingresados para seleccionar las productos son validos
 */
const validSelectProducts = async (selected)  => { 
    let products = selected.split(',');
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
        
        const found = lastContainerProducts.find(element => element == elementS.numberProduct);
        if (found == undefined) {
            flag = true;
        }
    });
    return flag;
}

/**
 * Metodo que permite guardar un delivery
 */
const saveOrder = async (ctx)  => {
    let dataProducts = {
        products: [],
        address: "",
        longitude: "",
        latitude: "",
        phone: "",
        nameClient: "",
    };

    let data = [];
    contaninerProductos?.forEach(c => {
        if (c.quantity > 0) {
            dataProducts.products.push({
                "_id": c._id,
                "name": c.name,
                "price": c.price,
                "category": c.category,
                "quantity": c.quantity
            });
        }
    });

    dataProducts.address = ctx?.message?.conversation;
    dataProducts.latitude = ctx?.message?.locationMessage?.degreesLatitude;
    dataProducts.longitude = ctx?.message?.locationMessage?.degreesLongitude;
    dataProducts.phone = ctx?.from;
    dataProducts.nameClient = ctx?.pushName;
    data.push(`\n🙌Su pedido fue exitoso, le contactara un operador para Validar El Pedido🙌`);
    
    postDelivery(dataProducts);
    return {body: `${data}`}
}

/**
 * Metodo que permite consultar las promociones
 */
const getPromotion = async (selected)  => {
    const products = await getProducts("64adedb4035179d0b5492fe1", "promotion");
    let data= [];
    data.push("Promociones Disponibles");
    let counter = 1
    lastContainerPromotions = [];
    products?.data.forEach(c => {
        let value =`\n 👉# ${counter}: *${c.name}* ${c.description} Price:${c.price}\n`
        data.push(value)
        lastContainerPromotions.push(counter)
        let result = contaninerProductos.findIndex(elementP => {
            if (elementP._id == c._id) {
                return true
            }
        })

        if (result == -1) {
            contaninerProductos.push({
                "_id": c._id,
                "name": c.name,
                "nameView": value,
                "counter": counter,
                "price": c.price,
                "category": c.categoryProducts[0],
                "quantity": 0,
                "status": false
            })
        }
        value = '';
        counter++;
    });
    
    const prod = {body: `${data}`};

    return prod;
}

/**
 * Metodo que permite consultar y crear la lista de productos
 */
const product = async (selected)  => {
    // console.log('product selected', selected)
    const found = contaninerIdCategory.find(element => element.numberCategory == `${selected}`);
    if ( found !== undefined && found?.id !== undefined ) {
        // console.log('ingreso al if validacion', found.id)
        categorySelectActive = found;
        lastContainerProducts = [];
        const products = await getProducts(found.id, "regular");
        let data= [];
        // const mapDatos = catgories.data.map((c) => ({body: `${c.name}`}))
            data.push("Productos Disponibles");
            data.push("\nIndique el numero de producto de su interes:");
            let counter = 1;
            products.data.forEach(c => {
                // console.log('c procategoryProductsductos', c)
                let value =`\n 👉#: ${counter} ${c.name} Price:${c.price}`
                data.push(value)
                lastContainerProducts.push(counter)
                let result = contaninerProductos.findIndex(elementP => {
                    if (elementP._id == c._id) {
                        return true
                    }
                })

                if (result == -1) {
                    contaninerProductos.push({
                        "_id": c._id,
                        "name": c.name,
                        "nameView": value,
                        "counter": counter,
                        "price": c.price,
                        "category": c.categoryProducts[0],
                        "quantity": 0,
                        "status": false
                    })
                }
                value = '';
                counter++;
            });
            const prod = {body: `${data}`}
            return prod;
    }
}

/**
 * Metodo que muestra la lista de productos previamente seleccionados
 */
const listProductSelected = async (selected)  => {
    let data= [];

    data.push("Productos Seleccionados\n\n");

    let counter = 1
    let sumProducts = 0;
    console.log('listProductSelected lelgo')
    contaninerProductos.forEach(c => {
        if (c.quantity != 0) {
            let value =`👉: ${c.name} Cantidad:${c.quantity}  Precio:${c.price}\n`
            data.push(value)
            sumProducts =  ( parseFloat(sumProducts) + (parseFloat(c.price) * parseFloat(c.quantity)))
        }

        value = '';
        counter++;
    });
    
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        minimumFractionDigits: 3,
        currency:"CLP"
    }) 
    
    const dollar = formatter.format(sumProducts);
    data.push(`\nTotal a Pagar: ${dollar}`);
    return {body: `${data}`}
}

/**
 * Metodo que muestra la lista de productos previamente seleccionados
 */
const listProductPreSelected = async (selected)  => {
    let data= [];
    data.push("Indique en orden la cantidad por cada combo seleccionado\n\n");
    let counter = 1
    // let sumProducts = 0;
    contaninerProductos.forEach(c => {
        if (c.quantity == 0 && c.status) {
            let value =`👉:#${counter} ${c.name}  Precio:${c.price}\n`
            data.push(value)
        }
        value = '';
        counter++;
    });
    
    return {body: `${data}`}
}

// module.exports = listProductPreSelected,
module.exports = { cleanData, listProductPreSelected, listProductSelected, product, getPromotion, saveOrder, validSelectProducts, validSelectCategory, postDelivery, getCategory, category, addproducts, validSelectPromotion, addPromotions }
// export default sumar;
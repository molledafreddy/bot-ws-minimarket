// import  mongoose, { Schema, Types, model, Model } from "mongoose";
// import { Bank } from "../interfaces/bank.interface";
const mongoose = require("mongoose")
// const mongoose = require("mongoose")
const bcrypt = require("bcrypt-nodejs")

const productSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true
    },
    price: {
        type: String,
        required: true
    },
    categoria: {
        type: String,
        required: true
    },
    description: {
    type: String,
    required: true
    },
    age: Number
  });
  
//   const Puppy = mongoose.model('products', productSchema);

  module.exports = mongoose.model('products', productSchema)
//   const productModel = model('products', productSchema);
//   export default productModel;
// const BankSchema: Schema = new Schema <Bank> (
//     {
//         name: {
//             type: String,
//             required: true,
//         },
//         description: {
//             type: String
//         }
//     }, 
//     {
//         timestamps: true,
//         versionKey: false
//     }
// );

// const BankModel = model('banks', BankSchema);
// export default BankModel;
require("dotenv").config();
console.log(process.env.NODE_ENV)

import knex from 'knex';


export const DB = knex(process.env.NODE_ENV === 'production'?{
  client: 'pg',
  connection: {
    host : '/cloudsql/lancer-api-375702:us-central1:dev-lancer-db',
    debug:  true,
    user : 'postgres',
    password : 'developer',
    database : 'postgres'
  }
} : {
  client: 'pg',
  connection: {
    host : '0.0.0.0',
    debug:  true,
    user : 'developer',
    password : 'developer',
    database : 'developer'
  }})

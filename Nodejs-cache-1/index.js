const express = require('express');
const fetch = require('minipass-fetch'); // Use node-fetch instead of minipass-fetch
const redis = require('redis');

const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.REDIS_PORT || 6379;

async function main() {
  const client = redis.createClient(REDIS_PORT);
  client.on('error', err => console.error('Redis Client Error', err));
  await client.connect();

  const app = express();

  // Set response
  function setResponse(value) {
    return `<h2>Product has ${value} in store</h2>`;
  }

  async function getRepos(req, res, next) {
    try {
      console.log('Fetching Data...');
      const response = await fetch(`https://dummyjson.com/products`);
      const data = await response.json();
      
      const productStocks = data.products.map(res => res.stock);
      const stocksData = productStocks.public_repos;
      console.log(productStocks);
  
      await client.setEx('repos', 3600, JSON.stringify(productStocks));
  
      res.send(setResponse(productStocks)); // Send response as HTML
    } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error'); // Send error as text
    }
  }
  


  function cache(req, res, next) {
    const key = req.path;
    client.get(key, (err, data) => {
      if (err) throw err;
  
      if (data !== null) {
        res.send(setResponse(JSON.parse(data)));
      } else {
        next();
      }
    });
  }
  

  app.get('/repos', cache, getRepos);

  app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
  });
}

main().catch(console.error);
A GraphQL server (Apollo Server) to wrap the ProPublica Congress API: https://projects.propublica.org/api-docs/congress-api/.

My intent with this project is to work through what's available in the ProPublica API and selectively add things to this API.

The server is deployed automatically to Heroku from `main`.

### To develop

Get your API Key from ProPublica (free, super easy): https://www.propublica.org/datastore/api/propublica-congress-api.

```
npm install
PROPUBLICA_KEY=<YOUR_KEY> npm start:dev
```

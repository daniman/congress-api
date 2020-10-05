const fs = require("fs");
const { ApolloServer, gql } = require("apollo-server");
const fetch = require("node-fetch");

const typeDefs = fs.readFileSync("./schema.graphql", "utf8").toString();

const headers = {
  "X-API-Key": process.env.PROPUBLICA_KEY || "FAKE_KEY",
};

console.log(process.env.PROPUBLICA_KEY);

const toCamel = (s) => {
  return s.replace(/([-_][a-z])/gi, ($1) => {
    return $1.toUpperCase().replace("-", "").replace("_", "");
  });
};

const snakeToCamel = (object) => {
  const newObj = {};
  Object.entries(object).forEach(([key, value]) => {
    newObj[toCamel(key)] =
      value instanceof Array
        ? value.map((item) => snakeToCamel(item))
        : !!value && typeof value === "object"
        ? snakeToCamel(value)
        : value;
  });
  return newObj;
};

const resolvers = {
  Query: {
    congress: async (_, args) => {
      if (!args.congress)
        throw new Error("Congress session must be specified, eg. 116");
      if (!args.chamber)
        throw new Error("Congress chamber must be specified, eg. SENATE");

      return await fetch(
        `https://api.propublica.org/congress/v1/${
          args.congress
        }/${args.chamber.toLowerCase()}/members.json`,
        {
          headers,
        }
      )
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            return data.results.map((res) => snakeToCamel(res));
          } else {
            throw new Error("Error fetching data. Did you include an API Key?");
          }
        })
        .catch((err) => new Error(err));
    },
    memberById: async (_, args) => {
      if (!args.id)
        throw new Error(
          "Must include an ID for a member of congress to fetch."
        );

      return await fetch(
        `https://api.propublica.org/congress/v1/members/${args.id}.json`,
        {
          headers,
        }
      )
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            return snakeToCamel(data.results[0]);
          } else {
            throw new Error("Error fetching data. Did you include an API Key?");
          }
        })
        .catch((err) => new Error(err));
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

server
  .listen({
    port: process.env.PORT || 4000,
  })
  .then(({ url }) => {
    console.log(`🚀  Server is running!
📭  Query at https://studio.apollographql.com/dev
🔉  Listening at ${url}`);
  });

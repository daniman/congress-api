const fs = require("fs");
const { ApolloServer, gql } = require("apollo-server");
const fetch = require("node-fetch");

const typeDefs = fs.readFileSync("./schema.graphql", "utf8").toString();

const headers = {
  "X-API-Key": process.env.PROPUBLICA_KEY || "FAKE_KEY",
};

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

      const data = await fetch(
        `https://api.propublica.org/congress/v1/${
          args.congress
        }/${args.chamber.toLowerCase()}/members.json`,
        {
          headers,
        }
      )
        .then((res) => res.json())
        .catch((err) => new Error(err));
      return data.results.map((res) => snakeToCamel(res));
    },
    memberById: async (_, args) => {
      const data = await fetch(
        `https://api.propublica.org/congress/v1/members/${args.id}.json`,
        {
          headers,
        }
      )
        .then((res) => res.json())
        .catch((err) => new Error(err));
      return snakeToCamel(data.results[0]);
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

server.listen().then(({ url }) => {
  console.log(`🚀  Server is running!
📭  Query at https://studio.apollographql.com/dev
🔉  Listening at ${url}`);
});

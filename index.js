const fs = require("fs");
const{ ApolloServerPluginInlineTrace } = require("apollo-server-core");
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
  MemberVote: {
    vote: async (parent) => {
      if (!parent.voteUri)
        throw new Error("Cannot fetch vote without MemberVote.voteUri");

      return await fetch(parent.voteUri, {
        headers,
      })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            return snakeToCamel(data.results.votes.vote);
          } else {
            throw new Error("Error fetching data. Did you include an API Key?");
          }
        })
        .catch((err) => new Error(err));
    },
  },
  MemberDetails: {
    votes: async (parent, args) => {
      if (!parent.id)
        throw new Error(
          "Cannot fetch member vote data if Member.id is not requested."
        );

      return await fetch(
        `https://api.propublica.org/congress/v1/members/${parent.id}/votes.json?offset=${args.offset}`,
        {
          headers,
        }
      )
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            return data.results[0].votes.map((res) => snakeToCamel(res));
          } else {
            throw new Error("Error fetching data. Did you include an API Key?");
          }
        })
        .catch((err) => new Error(err));
    },
  },
  Bill: {
    details: async (parent, args) => {
      if (!parent.apiUri)
        throw new Error(
          "Cannot fetch member vote data if Member.id is not requested."
        );

      return await fetch(parent.apiUri, {
        headers,
      })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            console.log(data);
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
  plugins: [ApolloServerPluginInlineTrace()],
});

server
  .listen({
    port: process.env.PORT || 4000,
  })
  .then(({ port }) => {
    console.log(`🚀  Server is running!
📭  Query at https://studio.apollographql.com/dev
🔉  Listening on port ${port}`);
  });

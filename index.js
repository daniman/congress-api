const fs = require("fs");
const { ApolloServer, gql } = require("apollo-server");

const typeDefs = gql`
  type Book {
    title: String
    author: String
    description: String
  }

  type Query {
    books: [Book]
  }
`;

const books = [
  {
    title: "The Awakening",
    author: "Kate Chopin",
    review: "Pretty good.",
  },
  {
    title: "City of Glass",
    author: "Paul Auster",
    review: "A little hard to discern.",
  },
];

const resolvers = {
  Query: {
    books: () => books,
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

server.listen().then(({ url }) => {
  console.log(`🚀  Server is running!
📭  Query at https://studio-staging.apollographql.com/dev
🔉  Listening at ${url}`);
});

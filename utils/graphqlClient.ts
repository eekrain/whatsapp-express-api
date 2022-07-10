import { GraphQLClient } from "graphql-request";
import { getSdk } from "../graphql/gql-generated";
import { Request } from "express";

interface Headers {
  "x-hasura-role": string;
  "x-hasura-user-id": string;
}

const graphqlUrl = () => `${process.env.NHOST_BACKEND_URL}/v1/graphql`;
const adminSecret = () => process.env.NHOST_ADMIN_SECRET || "";

export const getUserSdk = (req: Request) => {
  console.log(
    "🚀 ~ file: graphqlClient.ts ~ line 11 ~ graphqlUrl",
    graphqlUrl()
  );
  const session_variables: Headers = req.body.session_variables;
  const client = new GraphQLClient(graphqlUrl(), {
    headers: {
      "x-hasura-role": session_variables["x-hasura-role"],
      "x-hasura-user-id": session_variables["x-hasura-user-id"],
      authorization: req.headers?.authorization || "",
    },
  });
  return getSdk(client);
};

export const getAdminSdk = () => {
  console.log(
    "🚀 ~ file: graphqlClient.ts ~ line 11 ~ graphqlUrl",
    graphqlUrl(),
    adminSecret()
  );
  const client = new GraphQLClient(graphqlUrl(), {
    headers: {
      "x-hasura-admin-secret": adminSecret(),
    },
  });
  return getSdk(client);
};

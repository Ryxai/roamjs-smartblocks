import { APIGatewayProxyHandler } from "aws-lambda";
import randomstring from "randomstring";
import { dynamo, headers, validToken } from "./common";
import sha256 from "crypto-js/sha256";

export const handler: APIGatewayProxyHandler = async (event) => {
  const { graph } = JSON.parse(event.body) as {
    graph: string;
  };
  return dynamo 
    .getItem({
      TableName: "RoamJSSmartBlocks",
      Key: {
        uuid: {
          S: graph,
        },
      },
    })
    .promise()
    .then((r) => {
      if (
       (!r.Item || r.Item?.status?.S === "USER") && validToken(event, r.Item)
      ) {
        const newToken = randomstring.generate();
        return dynamo
          .putItem({
            TableName: "RoamJSSmartBlocks",
            Item: {
              uuid: { S: graph },
              name: { S: graph },
              status: { S: "USER" },
              token: { S: sha256(newToken).toString() },
            },
          })
          .promise()
          .then(() => ({
            statusCode: 200,
            body: JSON.stringify({ token: newToken }),
            headers,
          }));
      } else {
        return {
          statusCode: 401,
          body: `Unauthorized to generate token for graph ${graph}`,
          headers,
        };
      }
    })
    .catch((e) => ({
      statusCode: 500,
      body: e.message,
      headers,
    }));
};

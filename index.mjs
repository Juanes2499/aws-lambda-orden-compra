import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { DynamoDBClient, PutItemCommand} from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid"

// Create an SQS client service object
const sqs = new SQSClient({ region: "us-east-1" });

// Create a DynamoDB client object
const dynamoDBClient = new DynamoDBClient({ region: "us-east-1" });

// Create a DynamoDB Document Client
// const docClient = DynamoDBDocumentClient.from(dynamoDBClient);

export const handler = async (event) => {

  const uuidData = `OC-${uuidv4()}`;

  console.log("Orden Compra ID: ", uuidData)

  try {

    const item = {
      TableName: "DynamoDb-Orden-Compra",
      Item: {
        "ordenCompraId": {
          "S": uuidData
        },
        "productos": {
          "L": [
            {
              "M": {
                "productoId": {
                  "S": event.data.productos[0].productoId
                },
                "nombre": {
                  "S": event.data.productos[0].nombre
                },
                "descripcion": {
                  "S": event.data.productos[0].descripcion
                },
                "aplicaDescuento": {
                  "BOOL": event.data.productos[0].aplicaDescuento
                },
                "codigoDescuento": {
                  "S": event.data.productos[0].codigoDescuento
                },
                "porcentajeDescuento": {
                  "S": event.data.productos[0].porcentajeDescuento
                },
                "moneda": {
                  "S": event.data.productos[0].moneda
                },
                "precio": {
                  "S": event.data.productos[0].precio
                },
                "cantidad": {
                  "S": event.data.productos[0].cantidad
                },
                "total": {
                  "S": event.data.productos[0].total
                }
              }
            }
          ]
        },
        "valorTotalPagar": {
          "S": event.data.valorTotalPagar
        },
        "cliente": {
          "M": {
            "clienteId": {
              "S": event.data.cliente.clienteId
            },
            "nombres": {
              "S": event.data.cliente.nombres
            },
            "apellidos": {
              "S": event.data.cliente.apellidos
            },
            "tipoDocumento": {
              "S": event.data.cliente.tipoDocumento
            },
            "numerodDocuemnto": {
              "S": event.data.cliente.numerodDocuemnto
            },
            "paisDocumento": {
              "S": event.data.cliente.paisDocumento
            },
            "contacto": {
              "M": {
                "indicativo": {
                  "S": event.data.cliente.contacto.indicativo
                },
                "numeroCelular": {
                  "S": event.data.cliente.contacto.numeroCelular
                },
                "correoElectronico": {
                  "S": event.data.cliente.contacto.correoElectronico
                }
              }
            },
            "direccion": {
              "M": {
                "pais": {
                  "S": event.data.cliente.direccion.pais
                },
                "estado": {
                  "S": event.data.cliente.direccion.estado
                },
                "ciudad": {
                  "S": event.data.cliente.direccion.ciudad
                },
                "códigoPostal": {
                  "S": event.data.cliente.direccion.códigoPostal
                },
                "descripcionDireccion": {
                  "S": event.data.cliente.direccion.descripcionDireccion
                }
              }
            },
            "aplicaFacturaElectronica": {
              "BOOL": event.data.cliente.aplicaFacturaElectronica
            }
          }
        },
        "stage": {
          "S": "SQS DOMICILIOS"
        }
      }
    };

    const command = new PutItemCommand(item);
    await dynamoDBClient.send(command);

    try {

      const params = {
        QueueUrl: "https://sqs.us-east-1.amazonaws.com/211125768545/Sqs-Domicilios",
        MessageBody: JSON.stringify({
          ordenCompraId: uuidData,
          data: event.data
        }),
      };

      const dataSqsSent = await sqs.send(new SendMessageCommand(params));

      const response = {
        statusCode: 200,
        system: "Orden Compra",
        ordenCompraId: uuidData,
        dataSqs: dataSqsSent,
        stage: "SQS DOMICILIOS",
        data: event.data
      };

      return response;
    } catch {
      console.error("Error", err);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "Error pushing to SQS Domicilios" })
      };
    }
  } catch (err) {
    console.error("Error", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error inserting item on DynamoDB Orden Compra" })
    };
  }
};

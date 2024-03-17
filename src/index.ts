import { APIGatewayEvent, Handler } from 'aws-lambda';
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { DynamoDBClient, PutItemCommand} from "@aws-sdk/client-dynamodb";
import moment from "moment-timezone";
import { v4 as uuidv4 } from "uuid"
import { OrdenCompra } from './models/OrdenCompra';

// Create an SQS client service object
const sqs = new SQSClient({ region: "us-east-1" });

// Create a DynamoDB client object
const dynamoDBClient = new DynamoDBClient({ region: "us-east-1" });

export const handler: Handler = async (event: APIGatewayEvent) => {

  const uuidData = `OC-${uuidv4()}`;
  console.log("Orden Compra ID: ", uuidData)

  const timezone = 'America/Bogota';
  const currentTime = moment().tz(timezone).format();

  const body = event.body as unknown as OrdenCompra;

  console.log("Input data: ", body)

  const productsList: any[] = [];

  body.productos.forEach(x =>  {
    productsList.push({
      "M": {
        "productoId": {
          "S": x.productoId
        },
        "nombre": {
          "S": x.nombre
        },
        "descripcion": {
          "S": x.descripcion
        },
        "aplicaDescuento": {
          "BOOL": x.aplicaDescuento
        },
        "codigoDescuento": {
          "S": x.codigoDescuento
        },
        "porcentajeDescuento": {
          "S": x.porcentajeDescuento
        },
        "moneda": {
          "S": x.moneda
        },
        "precio": {
          "S": x.precio
        },
        "cantidad": {
          "S": x.cantidad
        },
        "total": {
          "S": x.total
        }
      }
    })
  })

  try {

    const item = {
      TableName: "DynamoDb-Orden-Compra",
      Item: {
        "ordenCompraId": {
          "S": uuidData
        },
        "productos": {
          "L": productsList
        },
        "valorTotalPagar": {
          "S": body.valorTotalPagar
        },
        "cliente": {
          "M": {
            "clienteId": {
              "S": body.cliente.clienteId
            },
            "nombres": {
              "S": body.cliente.nombres
            },
            "apellidos": {
              "S": body.cliente.apellidos
            },
            "tipoDocumento": {
              "S": body.cliente.tipoDocumento
            },
            "numerodDocuemnto": {
              "S": body.cliente.numerodDocuemnto
            },
            "paisDocumento": {
              "S": body.cliente.paisDocumento
            },
            "contacto": {
              "M": {
                "indicativo": {
                  "S": body.cliente.contacto.indicativo
                },
                "numeroCelular": {
                  "S": body.cliente.contacto.numeroCelular
                },
                "correoElectronico": {
                  "S": body.cliente.contacto.correoElectronico
                }
              }
            },
            "direccion": {
              "M": {
                "pais": {
                  "S": body.cliente.direccion.pais
                },
                "estado": {
                  "S": body.cliente.direccion.estado
                },
                "ciudad": {
                  "S": body.cliente.direccion.ciudad
                },
                "codigoPostal": {
                  "S": body.cliente.direccion.codigoPostal
                },
                "descripcionDireccion": {
                  "S": body.cliente.direccion.descripcionDireccion
                }
              }
            },
            "aplicaFacturaElectronica": {
              "BOOL": body.cliente.aplicaFacturaElectronica
            }
          }
        },
        "stage": {
          "S": "SQS DOMICILIOS"
        },
        "createdAt": {
          "S": currentTime
        },
        "updatedAt": {
          "S": currentTime
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
          data: body
        }),
      };

      const dataSqsSent = await sqs.send(new SendMessageCommand(params));

      const response = {
        statusCode: 200,
        system: "Orden Compra",
        ordenCompraId: uuidData,
        dataSqs: dataSqsSent,
        stage: "SQS DOMICILIOS",
        data: body
      };

      return response;
    } catch (errSqs){
      console.error("Error", errSqs);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "Error pushing to SQS Domicilios" })
      };
    }
  } catch (errDynamoDb) {
    console.error("Error", errDynamoDb);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error inserting item on DynamoDB Orden Compra" })
    };
  }
};

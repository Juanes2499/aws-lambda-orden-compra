import { Cliente } from "./Cliente";
import { Producto } from "./Producto";

export interface OrdenCompra {
  productos: Producto[];
  valorTotalPagar: string;
  cliente: Cliente;
}

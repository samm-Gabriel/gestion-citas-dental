export type CodigoError =
  | "VALIDACION"
  | "JSON_INVALIDO"
  | "NO_ENCONTRADO"
  | "CONFLICTO"
  | "CI_DUPLICADO"
  | "NOMBRE_DUPLICADO"
  | "CHOQUE_HORARIO"
  | "EN_USO"
  | "CITA_EN_PASADO"
  | "FUERA_DE_HORARIO"
  | "INACTIVO"
  | "ESTADO_INVALIDO"
  | "ERROR_INTERNO";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: CodigoError,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const noEncontrado = (message: string) => new ApiError(404, "NO_ENCONTRADO", message);

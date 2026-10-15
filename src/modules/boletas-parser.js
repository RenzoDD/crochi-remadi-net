
const { XMLParser } = require("fast-xml-parser");

function ParseBoleta(xml) {
    if (!xml || typeof xml !== "string") {
        throw new Error("Debes proporcionar el XML como string.");
    }

    const parser = new XMLParser({
        ignoreAttributes: false,
        removeNSPrefix: true,
        trimValues: true,
        parseTagValue: false,
        cdataPropName: "__cdata"
    });

    const documento = parser.parse(xml);
    const invoice = documento.Invoice;

    if (!invoice) {
        throw new Error("El XML no contiene un documento Invoice válido.");
    }

    // Obtener serie y correlativo: EB01-1
    const numeroDocumento = invoice.ID;

    if (!numeroDocumento || typeof numeroDocumento !== "string") {
        throw new Error("No se encontró el número de la boleta.");
    }

    const partes = numeroDocumento.split("-");

    if (partes.length !== 2) {
        throw new Error(
            "El número de boleta no tiene el formato SERIE-CORRELATIVO."
        );
    }

    const serie = partes[0];
    const correlativo = partes[1];

    // Función auxiliar para obtener el valor de una etiqueta XML.
    function obtenerValor(valor) {
        if (valor === undefined || valor === null) {
            return null;
        }

        if (typeof valor === "object") {
            return valor["#text"] ?? valor["__cdata"] ?? null;
        }

        return valor;
    }

    // Obtener el monto total.
    const montoTexto = obtenerValor(
        invoice.LegalMonetaryTotal?.PayableAmount
    );

    const montoTotal = Number(montoTexto);

    if (montoTexto === null || !Number.isFinite(montoTotal)) {
        console.error(
            "Estructura de LegalMonetaryTotal:",
            JSON.stringify(invoice.LegalMonetaryTotal, null, 2)
        );

        throw new Error("No se encontró un monto total válido.");
    }

    // Obtener los datos del cliente.
    const cliente = invoice.AccountingCustomerParty?.Party;

    const nombreCliente = obtenerValor(
        cliente?.PartyLegalEntity?.RegistrationName
    ) ?? "";

    const documentoCliente = obtenerValor(
        cliente?.PartyIdentification?.ID
    ) ?? "";

    return {
        serie,
        correlativo,
        montoTotal,
        cliente: nombreCliente,
        documentoCliente
    };
}

module.exports = ParseBoleta;
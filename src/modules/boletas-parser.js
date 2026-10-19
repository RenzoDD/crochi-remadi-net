const { XMLParser, XMLValidator } = require("fast-xml-parser");

// Configuración del parser XML
const parser = new XMLParser({
  ignoreAttributes: false,
  removeNSPrefix: true,
  trimValues: true,
  parseTagValue: false,
  cdataPropName: "__cdata"
});

// Convierte una etiqueta XML a un valor simple.
// Maneja strings, CDATA, objetos y valores nulos.
function valor(obj) {
  if (obj === undefined || obj === null) {
    return null;
  }

  if (Array.isArray(obj)) {
    return obj.length > 0 ? valor(obj[0]) : null;
  }

  if (typeof obj === "object") {
    if (Object.prototype.hasOwnProperty.call(obj, "#text")) {
      return valor(obj["#text"]);
    }

    if (Object.prototype.hasOwnProperty.call(obj, "__cdata")) {
      return valor(obj["__cdata"]);
    }

    return null;
  }

  const resultado = String(obj).trim();

  return resultado === "" ? null : resultado;
}

// Convierte un valor a número.
// Devuelve null cuando el dato no existe o no es numérico.
function numero(obj) {
  const dato = valor(obj);

  if (dato === null) {
    return null;
  }

  const resultado = Number(dato);

  return Number.isFinite(resultado) ? resultado : null;
}

// Garantiza que el resultado sea un array.
function lista(obj) {
  if (obj === undefined || obj === null) {
    return [];
  }

  return Array.isArray(obj) ? obj : [obj];
}

// Extrae un identificador XML y su tipo de documento.
function obtenerIdentificacion(party) {
  if (!party) {
    return null;
  }

  const identificacion =
    party.PartyIdentification?.ID ??
    party.PartyLegalEntity?.CompanyID ??
    null;

  if (identificacion === null) {
    return null;
  }

  return {
    numero: valor(identificacion),
    tipo: identificacion?.["@_schemeID"] ?? null
  };
}

// Extrae una dirección del XML.
// Admite RegistrationAddress y PostalAddress.
function obtenerDireccion(party) {
  if (!party) {
    return null;
  }

  const entidadLegal = party.PartyLegalEntity;

  const direccion =
    entidadLegal?.RegistrationAddress ??
    party.PostalAddress ??
    entidadLegal?.PostalAddress ??
    null;

  if (!direccion) {
    return null;
  }

  const lineaDireccion = valor(
    direccion.AddressLine?.Line
  );

  return {
    direccionCompleta: lineaDireccion,

    // El XML no siempre proporciona la urbanización por separado.
    // Se intenta identificarla en la dirección completa.
    urbanizacion: obtenerUrbanizacion(lineaDireccion),

    distrito: valor(direccion.District),

    provincia: valor(direccion.CityName),

    departamento: valor(direccion.CountrySubentity),

    ubigeo: valor(direccion.CountrySubentityCode),

    pais: valor(direccion.Country?.IdentificationCode)
  };
}

// Intenta extraer el nombre de la urbanización de una dirección.
// Ejemplo: "... URB. LOS JARDINES DE SANTA ROS".
function obtenerUrbanizacion(direccion) {
  if (!direccion) {
    return null;
  }

  const coincidencia = direccion.match(
    /\b(?:URB\.?|URBANIZACI[ÓO]N)\s+(.+)$/i
  );

  if (!coincidencia) {
    return null;
  }

  return coincidencia[1].trim();
}

// Extrae información de contacto.
function obtenerContacto(party) {
  return {
    telefono: valor(party?.Contact?.Telephone),
    correo: valor(party?.Contact?.ElectronicMail)
  };
}

// Extrae impuestos de un TaxTotal.
function obtenerImpuestos(taxTotal) {
  return lista(taxTotal).map((impuesto) => ({
    importeTotal: numero(impuesto.TaxAmount),

    moneda: impuesto.TaxAmount?.["@_currencyID"] ?? null,

    detalles: lista(impuesto.TaxSubtotal).map((detalle) => {
      const categoria = detalle.TaxCategory ?? {};
      const tributo = categoria.TaxScheme ?? {};

      return {
        baseImponible: numero(detalle.TaxableAmount),

        importe: numero(detalle.TaxAmount),

        moneda: detalle.TaxAmount?.["@_currencyID"] ?? null,

        categoria: {
          codigo: valor(categoria.ID),

          porcentaje: numero(categoria.Percent),

          codigoExoneracion: valor(
            categoria.TaxExemptionReasonCode
          ),

          tributo: {
            codigo: valor(tributo.ID),
            nombre: valor(tributo.Name),
            tipo: valor(tributo.TaxTypeCode)
          }
        }
      };
    })
  }));
}

// Extrae productos o servicios de InvoiceLine.
function obtenerProductos(invoiceLine) {
  return lista(invoiceLine).map((linea) => {
    const precio = linea.Price?.PriceAmount;

    const precioAlternativo =
      linea.PricingReference
        ?.AlternativeConditionPrice
        ?.PriceAmount;

    const impuestos = obtenerImpuestos(linea.TaxTotal);

    const totalImpuestos = impuestos.reduce(
      (total, impuesto) =>
        total + (impuesto.importeTotal ?? 0),
      0
    );

    return {
      numeroLinea: valor(linea.ID),

      producto: {
        descripcion: valor(linea.Item?.Description),

        codigo: valor(
          linea.Item?.SellersItemIdentification?.ID
        ),

        codigoEstandar: valor(
          linea.Item?.StandardItemIdentification?.ID
        )
      },

      cantidad: numero(linea.InvoicedQuantity),

      unidadMedida:
        linea.InvoicedQuantity?.["@_unitCode"] ?? null,

      precioUnitario: numero(precio),

      monedaPrecioUnitario:
        precio?.["@_currencyID"] ?? null,

      precioAlternativo: numero(precioAlternativo),

      monedaPrecioAlternativo:
        precioAlternativo?.["@_currencyID"] ?? null,

      subtotal: numero(linea.LineExtensionAmount),

      monedaSubtotal:
        linea.LineExtensionAmount?.["@_currencyID"] ?? null,

      impuestos,

      totalImpuestos
    };
  });
}

// Extrae descuentos y cargos.
function obtenerDescuentosYCargos(allowanceCharge) {
  return lista(allowanceCharge).map((item) => ({
    esCargo: valor(item.ChargeIndicator),

    motivo: valor(item.AllowanceChargeReason),

    codigoMotivo: valor(item.AllowanceChargeReasonCode),

    importe: numero(item.Amount),

    moneda: item.Amount?.["@_currencyID"] ?? null,

    porcentaje: numero(item.MultiplierFactorNumeric),

    base: numero(item.BaseAmount)
  }));
}

// Extrae los medios de pago.
function obtenerPagos(paymentMeans) {
  return lista(paymentMeans).map((pago) => ({
    medio: valor(pago.PaymentMeansCode),

    identificador: valor(pago.PaymentID),

    cuenta: valor(pago.PayeeFinancialAccount?.ID)
  }));
}

// Extrae documentos de referencia adicionales.
function obtenerReferenciasAdicionales(referencias) {
  return lista(referencias).map((referencia) => ({
    numero: valor(referencia.ID),

    tipo: valor(referencia.DocumentTypeCode),

    descripcion: valor(referencia.DocumentDescription)
  }));
}

// Función principal.
function DecodificarBoleta(xml) {
  if (typeof xml !== "string" || xml.trim() === "") {
    throw new Error(
      "Debes proporcionar el XML de la boleta como texto."
    );
  }

  // Valida el XML antes de procesarlo.
  const validacion = XMLValidator.validate(xml);

  if (validacion !== true) {
    throw new Error(
      `El XML no es válido: ${
        validacion.err?.msg ?? "error de estructura"
      }`
    );
  }

  const documento = parser.parse(xml);

  // La raíz habitual del comprobante UBL es Invoice.
  const invoice = documento.Invoice ?? documento;

  if (!invoice || !invoice.ID) {
    throw new Error(
      "No se encontró Invoice/ID. Verifica que sea un XML UBL de boleta."
    );
  }

  // Partes del comprobante.
  const emisorParty =
    invoice.AccountingSupplierParty?.Party;

  const clienteParty =
    invoice.AccountingCustomerParty?.Party;

  // Identificador de serie y correlativo.
  const idComprobante = valor(invoice.ID);

  const partesId = idComprobante
    ? idComprobante.split("-")
    : [];

  // Totales.
  const totalLegal = invoice.LegalMonetaryTotal ?? {};

  const impuestosDocumento = obtenerImpuestos(
    invoice.TaxTotal
  );

  const productos = obtenerProductos(
    invoice.InvoiceLine
  );

  const totalImpuestosCalculado = impuestosDocumento.reduce(
    (total, impuesto) =>
      total + (impuesto.importeTotal ?? 0),
    0
  );

  // Datos del emisor.
  const emisor = {
    ruc: valor(
      emisorParty?.PartyIdentification?.ID
    ),

    tipoDocumento:
      emisorParty?.PartyIdentification?.ID?.["@_schemeID"] ??
      null,

    razonSocial: valor(
      emisorParty?.PartyLegalEntity?.RegistrationName
    ),

    nombreComercial: valor(
      emisorParty?.PartyName?.Name
    ),

    direccion: obtenerDireccion(emisorParty),

    ...obtenerContacto(emisorParty)
  };

  // Datos del cliente.
  const cliente = {
    identificacion: obtenerIdentificacion(clienteParty),

    numeroDocumento: valor(
      clienteParty?.PartyIdentification?.ID
    ),

    tipoDocumento:
      clienteParty?.PartyIdentification?.ID?.["@_schemeID"] ??
      null,

    nombre: valor(
      clienteParty?.PartyLegalEntity?.RegistrationName
    ),

    nombreComercial: valor(
      clienteParty?.PartyName?.Name
    ),

    direccion: obtenerDireccion(clienteParty),

    ...obtenerContacto(clienteParty)
  };

  // Datos del comprobante.
  const comprobante = {
    tipo: valor(invoice.InvoiceTypeCode),

    serieCorrelativo: idComprobante,

    serie:
      partesId.length >= 2
        ? partesId.slice(0, -1).join("-")
        : null,

    correlativo:
      partesId.length >= 2
        ? partesId[partesId.length - 1].padStart(8, '0')
        : null,

    fechaEmision: valor(invoice.IssueDate),

    horaEmision: valor(invoice.IssueTime),

    fechaVencimiento: valor(invoice.DueDate),

    moneda: valor(invoice.DocumentCurrencyCode),

    nota: valor(invoice.Note),

    numeroOrdenCompra: valor(
      invoice.OrderReference?.ID
    ),

    referenciasDocumentos: lista(
      invoice.BillingReference
    ).map((referencia) => ({
      numero: valor(
        referencia.InvoiceDocumentReference?.ID
      ),

      tipo: valor(
        referencia.InvoiceDocumentReference?.DocumentTypeCode
      )
    }))
  };

  // Datos económicos.
  const totales = {
    moneda: valor(invoice.DocumentCurrencyCode),

    subtotal: numero(
      totalLegal.LineExtensionAmount
    ),

    totalDescuentos: numero(
      totalLegal.AllowanceTotalAmount
    ),

    totalCargos: numero(
      totalLegal.ChargeTotalAmount
    ),

    totalImpuestos:
      numero(invoice.TaxTotal?.TaxAmount) ??
      totalImpuestosCalculado,

    totalAnticipos: numero(
      totalLegal.PrepaidAmount
    ),

    total: numero(
      totalLegal.PayableAmount
    ),

    importeRedondeo: numero(
      totalLegal.PayableRoundingAmount
    )
  };

  // Resultado final.
  return {
    comprobante,

    emisor,

    cliente,

    totales,

    impuestos: impuestosDocumento,

    productos,

    pagos: obtenerPagos(
      invoice.PaymentMeans
    ),

    descuentosYCargos: obtenerDescuentosYCargos(
      invoice.AllowanceCharge
    ),

    referenciasAdicionales: obtenerReferenciasAdicionales(
      invoice.AdditionalDocumentReference
    )
  };
}

module.exports = DecodificarBoleta

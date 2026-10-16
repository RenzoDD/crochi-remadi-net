const { XMLParser, XMLValidator } = require("fast-xml-parser");

const parser = new XMLParser({
  ignoreAttributes: false,
  removeNSPrefix: true,
  trimValues: true,
  parseTagValue: false,
  textNodeName: "#text",
  isArray: (name) => [
    "InvoiceLine",
    "TaxSubtotal",
    "TaxCategory",
    "AllowanceCharge",
    "PaymentMeans",
    "AdditionalDocumentReference"
  ].includes(name)
});

// Obtiene el valor de una etiqueta XML de forma segura.
function valor(obj) {
  if (obj === undefined || obj === null) return null;

  if (Array.isArray(obj)) {
    return obj.length ? valor(obj[0]) : null;
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

// Convierte un valor a número sin confundir un dato ausente con cero.
function numero(obj) {
  const dato = valor(obj);

  if (dato === null) return null;

  const resultado = Number(dato);
  return Number.isFinite(resultado) ? resultado : null;
}

// Devuelve una lista incluso si el XML contiene un solo elemento.
function lista(obj) {
  if (obj === undefined || obj === null) return [];
  return Array.isArray(obj) ? obj : [obj];
}

// Obtiene los datos de un identificador, por ejemplo DNI o RUC.
function obtenerIdentificacion(party) {
  if (!party) return null;

  const identificacion =
    party.PartyIdentification?.ID ??
    party.PartyLegalEntity?.CompanyID ??
    null;

  return {
    numero: valor(identificacion),
    tipo: identificacion?.["@_schemeID"] ?? null
  };
}

// Extrae los impuestos de un bloque TaxTotal.
function obtenerImpuestos(taxTotal) {
  return lista(taxTotal).map((impuesto) => ({
    importeTotal: numero(impuesto.TaxAmount),
    moneda: impuesto.TaxAmount?.["@_currencyID"] ?? null,

    detalles: lista(impuesto.TaxSubtotal).map((detalle) => ({
      baseImponible: numero(detalle.TaxableAmount),
      importe: numero(detalle.TaxAmount),
      moneda: detalle.TaxAmount?.["@_currencyID"] ?? null,

      categoria: {
        codigo: valor(detalle.TaxCategory?.ID),
        porcentaje: numero(detalle.TaxCategory?.Percent),
        codigoExoneracion: valor(
          detalle.TaxCategory?.TaxExemptionReasonCode
        ),

        tributo: {
          codigo: valor(detalle.TaxCategory?.TaxScheme?.ID),
          nombre: valor(detalle.TaxCategory?.TaxScheme?.Name),
          tipo: valor(detalle.TaxCategory?.TaxScheme?.TaxTypeCode)
        }
      }
    }))
  }));
}

// Extrae los productos o servicios de la boleta.
function obtenerProductos(invoiceLine) {
  return lista(invoiceLine).map((linea) => {
    const precio = linea.Price?.PriceAmount;
    const precioAlternativo = linea.PricingReference
      ?.AlternativeConditionPrice?.PriceAmount;

    const impuestos = obtenerImpuestos(linea.TaxTotal);

    return {
      numeroLinea: valor(linea.ID),

      producto: {
        descripcion: valor(linea.Item?.Description),
        codigo: valor(linea.Item?.SellersItemIdentification?.ID),
        codigoEstandar: valor(linea.Item?.StandardItemIdentification?.ID)
      },

      cantidad: numero(linea.InvoicedQuantity),
      unidadMedida: linea.InvoicedQuantity?.["@_unitCode"] ?? null,

      precioUnitario: numero(precio),
      monedaPrecioUnitario: precio?.["@_currencyID"] ?? null,

      precioAlternativo: numero(precioAlternativo),
      monedaPrecioAlternativo:
        precioAlternativo?.["@_currencyID"] ?? null,

      subtotal: numero(linea.LineExtensionAmount),
      monedaSubtotal: linea.LineExtensionAmount?.["@_currencyID"] ?? null,

      impuestos,

      totalImpuestos: impuestos.reduce(
        (total, impuesto) => total + (impuesto.importeTotal ?? 0),
        0
      )
    };
  });
}

// Función principal.
function ParseBoleta(xml) {
  if (typeof xml !== "string" || xml.trim() === "") {
    throw new Error("Debes proporcionar el XML de la boleta como texto.");
  }

  const validacion = XMLValidator.validate(xml);

  if (validacion !== true) {
    throw new Error(
      `El XML no es válido: ${validacion.err?.msg ?? "error de estructura"}`
    );
  }

  const documento = parser.parse(xml);

  // Acepta Invoice como raíz o dentro de una estructura envolvente.
  const invoice = documento.Invoice ?? documento;

  if (!invoice || !invoice.ID) {
    throw new Error(
      "No se encontró la etiqueta Invoice/ID. Verifica que sea un XML UBL de factura o boleta."
    );
  }

  const emisorParty = invoice.AccountingSupplierParty?.Party;
  const clienteParty = invoice.AccountingCustomerParty?.Party;

  const idComprobante = valor(invoice.ID);
  const partesId = idComprobante ? idComprobante.split("-") : [];

  const totalLegal = invoice.LegalMonetaryTotal ?? {};

  const impuestosDocumento = obtenerImpuestos(invoice.TaxTotal);
  const productos = obtenerProductos(invoice.InvoiceLine);

  const totalImpuestos = impuestosDocumento.reduce(
    (total, impuesto) => total + (impuesto.importeTotal ?? 0),
    0
  );

  return {
    comprobante: {
      tipo: valor(invoice.InvoiceTypeCode),
      serie: partesId.length >= 2 ? partesId.slice(0, -1).join("-") : null,
      correlativo: partesId.length >= 2 ? partesId.at(-1).padStart(10, "0") : null,

      fechaEmision: valor(invoice.IssueDate),
      horaEmision: valor(invoice.IssueTime),
      fechaVencimiento: valor(invoice.DueDate),

      moneda: valor(invoice.DocumentCurrencyCode),
      nota: valor(invoice.Note),

      numeroOrdenCompra: valor(invoice.OrderReference?.ID),

      referenciaDocumento: lista(invoice.BillingReference).map((ref) => ({
        numero: valor(ref.InvoiceDocumentReference?.ID),
        tipo: valor(ref.InvoiceDocumentReference?.DocumentTypeCode)
      }))
    },

    emisor: {
      ruc: valor(emisorParty?.PartyIdentification?.ID),
      tipoDocumento: emisorParty?.PartyIdentification?.ID?.["@_schemeID"] ?? null,

      razonSocial: valor(
        emisorParty?.PartyLegalEntity?.RegistrationName
      ),

      nombreComercial: valor(
        emisorParty?.PartyName?.Name
      ),

      direccion: {
        direccionCompleta: valor(
          emisorParty?.PostalAddress?.AddressLine?.Line
        ),

        urbanizacion: valor(
          emisorParty?.PostalAddress?.UrbanizationName
        ),

        distrito: valor(
          emisorParty?.PostalAddress?.District
        ),

        provincia: valor(
          emisorParty?.PostalAddress?.CityName
        ),

        departamento: valor(
          emisorParty?.PostalAddress?.CountrySubentity
        ),

        ubigeo: valor(
          emisorParty?.PostalAddress?.ID
        ),

        pais: valor(
          emisorParty?.PostalAddress?.Country?.IdentificationCode
        )
      },

      telefono: valor(
        emisorParty?.Contact?.Telephone
      ),

      correo: valor(
        emisorParty?.Contact?.ElectronicMail
      )
    },

    cliente: {
      identificacion: obtenerIdentificacion(clienteParty),
      nombre: valor(
        clienteParty?.PartyLegalEntity?.RegistrationName
      ),

      nombreComercial: valor(
        clienteParty?.PartyName?.Name
      ),

      direccion: {
        direccionCompleta: valor(
          clienteParty?.PostalAddress?.AddressLine?.Line
        ),

        distrito: valor(
          clienteParty?.PostalAddress?.District
        ),

        provincia: valor(
          clienteParty?.PostalAddress?.CityName
        ),

        departamento: valor(
          clienteParty?.PostalAddress?.CountrySubentity
        ),

        pais: valor(
          clienteParty?.PostalAddress?.Country?.IdentificationCode
        )
      },

      telefono: valor(
        clienteParty?.Contact?.Telephone
      ),

      correo: valor(
        clienteParty?.Contact?.ElectronicMail
      )
    },

    totales: {
      moneda: valor(invoice.DocumentCurrencyCode),

      subtotal: numero(totalLegal.LineExtensionAmount),
      totalDescuentos: numero(totalLegal.AllowanceTotalAmount),
      totalCargos: numero(totalLegal.ChargeTotalAmount),

      totalImpuestos: numero(invoice.TaxTotal?.TaxAmount) ?? totalImpuestos,

      totalAnticipos: numero(totalLegal.PrepaidAmount),
      importePagado: numero(totalLegal.PrepaidAmount),

      total: numero(totalLegal.PayableAmount),
      importeRedondeo: numero(totalLegal.PayableRoundingAmount),

      importeEnLetras: valor(invoice.LegalMonetaryTotal?.PayableAmountInWords)
    },

    impuestos: impuestosDocumento,

    productos,

    pagos: lista(invoice.PaymentMeans).map((pago) => ({
      medio: valor(pago.PaymentMeansCode),
      identificador: valor(pago.PaymentID),
      cuenta: valor(pago.PayeeFinancialAccount?.ID)
    })),

    descuentosYCargos: lista(invoice.AllowanceCharge).map((cargo) => ({
      esCargo: valor(cargo.ChargeIndicator),
      motivo: valor(cargo.AllowanceChargeReason),
      importe: numero(cargo.Amount),
      moneda: cargo.Amount?.["@_currencyID"] ?? null,
      porcentaje: numero(cargo.MultiplierFactorNumeric)
    })),

    referenciasAdicionales: lista(invoice.AdditionalDocumentReference).map(
      (referencia) => ({
        numero: valor(referencia.ID),
        tipo: valor(referencia.DocumentTypeCode),
        descripcion: valor(referencia.DocumentDescription)
      })
    )
  };
}

module.exports = ParseBoleta;
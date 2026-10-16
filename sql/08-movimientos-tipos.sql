CREATE TABLE MovimientosTipos (
	TipoId integer NOT NULL CONSTRAINT MovimientosTipos_pk PRIMARY KEY AUTOINCREMENT,
	Justificable boolean NOT NULL,
	Nombre varchar(50) NOT NULL
);

INSERT INTO MovimientosTipos (Justificable, Nombre) VALUES (0, 'Aporte de Capital');
INSERT INTO MovimientosTipos (Justificable, Nombre) VALUES (0, 'Retiro de Utilidades');
INSERT INTO MovimientosTipos (Justificable, Nombre) VALUES (1, 'Venta de Productos');
INSERT INTO MovimientosTipos (Justificable, Nombre) VALUES (0, 'Compra de Insumos');
INSERT INTO MovimientosTipos (Justificable, Nombre) VALUES (0, 'Pago de Servicios');
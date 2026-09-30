CREATE TABLE PedidosEstados (
	EstadoId integer NOT NULL CONSTRAINT PedidosEstados_pk PRIMARY KEY AUTOINCREMENT,
	Nombre varchar(50) NOT NULL,
    Color varchar(50) NOT NULL
);

INSERT INTO PedidosEstados (Nombre, Color) VALUES ('Registrado', 'secondary');
INSERT INTO PedidosEstados (Nombre, Color) VALUES ('En proceso', 'primary');
INSERT INTO PedidosEstados (Nombre, Color) VALUES ('Finalizado', 'success');
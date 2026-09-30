CREATE TABLE Pedidos (
	PedidoId integer NOT NULL CONSTRAINT Pedidos_pk PRIMARY KEY AUTOINCREMENT,

	Codigo varchar(10) NOT NULL,
	ClienteId integer NOT NULL,
	FechaEntrega date NOT NULL,
	MontoAdelanto decimal(8,2) NOT NULL,
	MontoTotal decimal(8,2) NOT NULL,
	Comentario varchar(500),

	BoletaNumero varchar(50),
	BoletaXML text,

	CreatedAt integer NOT NULL DEFAULT (unixepoch() * 1000),
	UpdatedAt integer NOT NULL DEFAULT (unixepoch() * 1000),
	IsDeleted boolean NOT NULL DEFAULT 0,

	CONSTRAINT Pedidos_Clientes FOREIGN KEY (ClienteId) REFERENCES Clientes (ClienteId)
);
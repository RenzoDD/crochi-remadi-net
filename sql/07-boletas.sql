CREATE TABLE Boletas (
	BoletaId integer NOT NULL CONSTRAINT Boletas_pk PRIMARY KEY AUTOINCREMENT,

	PedidoId integer NOT NULL,
	Numero text NOT NULL,
	Cliente text NOT NULL,
	Emision integer NOT NULL,
	Monto decimal(10,2) NOT NULL,
	XML text NOT NULL,
	

	CreatedAt integer NOT NULL DEFAULT (unixepoch() * 1000),
	UpdatedAt integer NOT NULL DEFAULT (unixepoch() * 1000),
	IsDeleted boolean NOT NULL DEFAULT 0,

	CONSTRAINT Boletas_Pedidos FOREIGN KEY (PedidoId) REFERENCES Pedidos (PedidoId)
);

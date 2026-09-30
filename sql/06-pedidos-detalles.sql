CREATE TABLE PedidosDetalles (
	DetalleId integer NOT NULL CONSTRAINT PedidosDetalles_pk PRIMARY KEY AUTOINCREMENT,

	PedidoId integer NOT NULL,
	ProductoId integer NOT NULL,
	Cantidad integer NOT NULL,
	PrecioUnitario decimal(8,2) NOT NULL,
	EstadoId integer NOT NULL,

	CreatedAt integer NOT NULL DEFAULT (unixepoch() * 1000),
	UpdatedAt integer NOT NULL DEFAULT (unixepoch() * 1000),
	IsDeleted boolean NOT NULL DEFAULT 0,

	CONSTRAINT PedidosDetalles_Pedidos FOREIGN KEY (PedidoId) REFERENCES Pedidos (PedidoId),
	CONSTRAINT PedidosDetalles_Productos FOREIGN KEY (ProductoId) REFERENCES Productos (ProductoId),
	CONSTRAINT PedidosDetalles_PedidosEstados FOREIGN KEY (EstadoId) REFERENCES PedidosEstados (EstadoId)
);
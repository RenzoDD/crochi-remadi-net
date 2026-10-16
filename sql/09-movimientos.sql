CREATE TABLE Movimientos (
	MovimientoId integer NOT NULL CONSTRAINT Movimientos_pk PRIMARY KEY AUTOINCREMENT,

    BoletaId integer,

    TipoId integer NOT NULL,
	Codigo varchar(8) NOT NULL,
	Fecha date NOT NULL,
	Descripcion varchar(100) NOT NULL,
	Ingreso integer NOT NULL,
	Egreso integer NOT NULL,

	CreatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	UpdatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	IsDeleted boolean NOT NULL DEFAULT 0,

	CONSTRAINT Movimientos_Boletas FOREIGN KEY (BoletaId) REFERENCES Boletas (BoletaId),
	CONSTRAINT Movimientos_Tipos FOREIGN KEY (TipoId) REFERENCES MovimientosTipos (TipoId)
);
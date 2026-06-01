from sqlalchemy import Column, Integer, String, Text, Date, ForeignKey
from sqlalchemy.orm import relationship
from src.config.db import Base

class Promocion(Base):
    __tablename__ = "Promociones"
    id_promocion      = Column(Integer,      primary_key=True, index=True)
    id_emprendimiento = Column(Integer,      ForeignKey("Emprendimientos.id_emprendimiento"), nullable=False)
    titulo            = Column(String(150),  nullable=False)
    descripcion       = Column(Text,         nullable=True)
    fecha_inicio      = Column(Date,         nullable=True)
    fecha_fin         = Column(Date,         nullable=True)
    estado            = Column(String(20),   nullable=False, default="activa")

    emprendimiento = relationship("Emprendimiento", back_populates="promociones")

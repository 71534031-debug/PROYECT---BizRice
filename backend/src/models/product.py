from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, ForeignKey, Boolean, func
from sqlalchemy.orm import relationship
from src.config.db import Base

class Producto(Base):
    __tablename__ = "Productos"
    id_producto       = Column(Integer, primary_key=True, index=True)
    id_emprendimiento = Column(Integer, ForeignKey("Emprendimientos.id_emprendimiento"), nullable=False)
    nombre            = Column(String(150), nullable=False)
    descripcion       = Column(Text,        nullable=True)
    precio            = Column(Numeric(10,2), nullable=True)
    imagen_url        = Column(String(255), nullable=True)
    stock             = Column(Integer,     nullable=False, default=0)
    estado_stock      = Column(String(20),  nullable=False, default="disponible")
    activo            = Column(Boolean,     nullable=False, default=True)
    fecha_creacion    = Column(DateTime, server_default=func.getdate())

    emprendimiento = relationship("Emprendimiento", back_populates="productos")
